import { ItemInstance, TreeInstance } from "../../types/core";
import { DndDataRef, DropTarget, DropTargetPosition } from "./types";

export const getDragCode = ({ item, index }: DropTarget<any>) =>
  `${item.getId()}__${index ?? "none"}`;

export const getDropTarget = <T>(
  e: any,
  item: ItemInstance<any>,
  tree: TreeInstance<any>
): DropTarget<T> => {
  const config = tree.getConfig();
  const bb = item.getElement()?.getBoundingClientRect();
  const verticalPos = bb ? (e.pageY - bb.top) / bb.height : 0.5;
  const pos =
    // eslint-disable-next-line no-nested-ternary
    verticalPos < (config.topLinePercentage ?? 0.3)
      ? DropTargetPosition.Top
      : verticalPos > (config.bottomLinePercentage ?? 0.7)
      ? DropTargetPosition.Bottom
      : DropTargetPosition.Item;

  if (!config.canDropInbetween) {
    return { item, index: null };
  }

  if (pos === DropTargetPosition.Item) {
    return { item, index: null };
  }

  // TODO it's much more complicated than this..
  return {
    item: item.getParent(),
    index: item.getIndexInParent() + (pos === DropTargetPosition.Top ? 0 : 1),
  };
};

export const canDrop = (
  e: any,
  item: ItemInstance<any>,
  tree: TreeInstance<any>
) => {
  const { draggedItems } = tree.getDataRef<DndDataRef<any>>().current;
  const config = tree.getConfig();
  const target = getDropTarget(e, item, tree);

  if (draggedItems && !(config.canDrop?.(draggedItems, target) ?? true)) {
    return false;
  }

  if (
    !draggedItems &&
    !config.canDropForeignDragObject?.(e.dataTransfer, target)
  ) {
    return false;
  }

  return true;
};