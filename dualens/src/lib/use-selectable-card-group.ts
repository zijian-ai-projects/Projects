import { useRef, type KeyboardEvent } from "react";

type SelectableCardItem<T extends string> = {
  id: T;
};

export function useSelectableCardGroup<T extends string>({
  items,
  selectedId,
  onSelect
}: {
  items: readonly SelectableCardItem<T>[];
  selectedId: T;
  onSelect(id: T): void;
}) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function selectAndFocus(id: T) {
    onSelect(id);
    itemRefs.current[id]?.focus();
  }

  function getAdjacentId(currentId: T, direction: "previous" | "next") {
    const currentIndex = items.findIndex((item) => item.id === currentId);

    if (currentIndex === -1) {
      return currentId;
    }

    const offset = direction === "next" ? 1 : -1;
    const nextIndex = (currentIndex + offset + items.length) % items.length;
    return items[nextIndex]?.id ?? currentId;
  }

  function getTargetId(event: KeyboardEvent<HTMLButtonElement>, currentId: T) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        return getAdjacentId(currentId, "next");
      case "ArrowUp":
      case "ArrowLeft":
        return getAdjacentId(currentId, "previous");
      case "Home":
        return items[0]?.id ?? currentId;
      case "End":
        return items.at(-1)?.id ?? currentId;
      default:
        return null;
    }
  }

  function getItemProps(id: T) {
    return {
      tabIndex: selectedId === id ? 0 : -1,
      onClick: () => onSelect(id),
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        const targetId = getTargetId(event, id);

        if (!targetId) {
          return;
        }

        event.preventDefault();

        if (targetId === id) {
          return;
        }

        selectAndFocus(targetId);
      },
      buttonRef: (node: HTMLButtonElement | null) => {
        itemRefs.current[id] = node;
      }
    };
  }

  return { getItemProps };
}
