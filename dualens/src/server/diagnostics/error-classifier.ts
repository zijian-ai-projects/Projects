import type {
  DiagnosticCategory,
  SessionDiagnosis,
  SessionDiagnosisContext
} from "@/lib/types";

function normalizeMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.trim();
  }

  return "Unknown provider error";
}

function getErrorCause(error: unknown) {
  if (error instanceof Error && typeof error.cause === "object" && error.cause !== null) {
    return error.cause as Record<string, unknown>;
  }

  return undefined;
}

function getStatusCode(error: unknown) {
  const cause = getErrorCause(error);
  const causeStatus = cause?.status;
  if (typeof causeStatus === "number") {
    return causeStatus;
  }

  const message = normalizeMessage(error);
  const match = message.match(/status (\d{3})/i);
  if (match) {
    return Number(match[1]);
  }

  return undefined;
}

function isTimeoutError(error: unknown, message: string) {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    /timeout|timed out|aborted/i.test(message)
  );
}

function isNetworkError(error: unknown, message: string) {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = getErrorCause(error);
  const causeCode = cause?.code;
  return (
    error.name === "TypeError" ||
    typeof causeCode === "string" ||
    /fetch failed|network|enotfound|econnreset|econnrefused|socket hang up/i.test(message)
  );
}

function isEndpointShapeError(message: string) {
  return /missing message content|not a valid object|was not valid json|invalid json|invalid object/i.test(
    message
  );
}

function isModelError(status: number | undefined, message: string) {
  return (
    status === 422 ||
    (status === 404 &&
      /(?:model(?:\s+deployment)?|deployment(?:\s+model)?)\b|(?:model|deployment)\s+(?:not found|missing|invalid|unknown|unavailable)|(?:deployment|model)\s+id\b|(?:deployment|model)\s+name\b/i.test(
        message
      ))
  );
}

function buildDiagnosis(
  category: DiagnosticCategory,
  context: SessionDiagnosisContext,
  message: string
): SessionDiagnosis {
  switch (category) {
    case "auth":
      return {
        stage: context.stage,
        failingStep: context.step,
        providerBaseUrl: context.baseUrl,
        providerModel: context.model,
        category,
        summary: "Authentication failed while contacting the model endpoint.",
        detail: message,
        suggestedFix: "Check the API key and confirm the endpoint accepts it."
      };
    case "model":
      return {
        stage: context.stage,
        failingStep: context.step,
        providerBaseUrl: context.baseUrl,
        providerModel: context.model,
        category,
        summary: "The selected model could not be used by the provider.",
        detail: message,
        suggestedFix: "Confirm the model name is valid for this endpoint."
      };
    case "endpoint-shape":
      return {
        stage: context.stage,
        failingStep: context.step,
        providerBaseUrl: context.baseUrl,
        providerModel: context.model,
        category,
        summary: "The provider returned a response with the wrong shape.",
        detail: message,
        suggestedFix: "Check whether the endpoint supports OpenAI-compatible chat completions."
      };
    case "network":
      return {
        stage: context.stage,
        failingStep: context.step,
        providerBaseUrl: context.baseUrl,
        providerModel: context.model,
        category,
        summary: "The request could not reach the model endpoint.",
        detail: message,
        suggestedFix: "Check network connectivity and the endpoint URL."
      };
    case "timeout":
      return {
        stage: context.stage,
        failingStep: context.step,
        providerBaseUrl: context.baseUrl,
        providerModel: context.model,
        category,
        summary: "The model request timed out before completing.",
        detail: message,
        suggestedFix: "Increase the timeout or reduce request load."
      };
    default:
      return {
        stage: context.stage,
        failingStep: context.step,
        providerBaseUrl: context.baseUrl,
        providerModel: context.model,
        category: "unknown",
        summary: "The model endpoint returned an unexpected error.",
        detail: message,
        suggestedFix: "Re-check the endpoint, model name, and provider compatibility."
      };
  }
}

export function classifyProviderError(
  error: unknown,
  context: SessionDiagnosisContext
): SessionDiagnosis {
  const message = normalizeMessage(error);
  const statusCode = getStatusCode(error);

  if (isTimeoutError(error, message)) {
    return buildDiagnosis("timeout", context, message);
  }

  if (statusCode === 401 || statusCode === 403) {
    return buildDiagnosis("auth", context, message);
  }

  if (isEndpointShapeError(message)) {
    return buildDiagnosis("endpoint-shape", context, message);
  }

  if (isNetworkError(error, message)) {
    return buildDiagnosis("network", context, message);
  }

  if (isModelError(statusCode, message)) {
    return buildDiagnosis("model", context, message);
  }

  return buildDiagnosis("unknown", context, message);
}
