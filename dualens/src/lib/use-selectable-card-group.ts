import { useRef, type KeyboardEvent } from "react";

type SelectableCardItem<T extends string> = {
  id: T;
};

type SelectableCardItemId<TItems extends readonly SelectableCardItem<string>[]> =
  TItems[number]["id"];

export function useSelectableCardGroup<const TItems extends readonly SelectableCardItem<string>[]>({
  items,
  selectedId,
  onSelect
}: {
  items: TItems;
  selectedId: SelectableCardItemId<TItems>;
  onSelect(id: SelectableCardItemId<TItems>): void;
}) {
  type ItemId = SelectableCardItemId<TItems>;

  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function selectAndFocus(id: ItemId) {
    onSelect(id);
    itemRefs.current[id]?.focus();
  }

  function getAdjacentId(currentId: ItemId, direction: "previous" | "next") {
    const currentIndex = items.findIndex((item) => item.id === currentId);

    if (currentIndex === -1) {
      return currentId;
    }

    const offset = direction === "next" ? 1 : -1;
    const nextIndex = (currentIndex + offset + items.length) % items.length;
    return items[nextIndex]?.id ?? currentId;
  }

  function getTargetId(event: KeyboardEvent<HTMLButtonElement>, currentId: ItemId) {
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

  function getItemProps(id: ItemId) {
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
