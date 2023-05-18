import { FeatureDefs, FeatureImplementation } from "../../types/core";
import { DndDataRef, DragAndDropFeatureDef } from "./types";
import { canDrop, getDragCode, getDropTarget } from "./utils";
import { makeStateUpdater } from "../../utils";

export const dragAndDropFeature: FeatureImplementation<
  any,
  DragAndDropFeatureDef<any>,
  FeatureDefs<any>
> = {
  key: "dragAndDrop",
  dependingFeatures: ["main", "tree", "selection"],

  getDefaultConfig: (defaultConfig, tree) => ({
    canDrop: (_, target) => target.item.isFolder(),
    setDndState: makeStateUpdater("dnd", tree),
    ...defaultConfig,
  }),

  createTreeInstance: (prev, tree) => ({
    ...prev,

    getDropTarget: () => {
      return tree.getState().dnd?.dragTarget ?? null;
    },
  }),

  createItemInstance: (prev, item, tree) => ({
    ...prev,

    getProps: () => ({
      ...prev.getProps(),

      draggable: tree.getConfig().isItemDraggable?.(item) ?? true,

      onDragStart: (e) => {
        const selectedItems = tree.getSelectedItems();
        const items = selectedItems.includes(item) ? selectedItems : [item];
        const config = tree.getConfig();

        if (!selectedItems.includes(item)) {
          tree.setSelectedItems([item.getItemMeta().itemId]);
        }

        if (!(config.canDrag?.(items) ?? true)) {
          e.preventDefault();
          return;
        }

        if (config.createForeignDragObject) {
          const { format, data } = config.createForeignDragObject(items);
          e.dataTransfer?.setData(format, data);
        }

        tree.getConfig().setDndState?.({
          draggedItems: items,
          draggingOverItem: tree.getFocusedItem(),
        });
      },

      onDragOver: (e) => {
        const target = getDropTarget(e, item, tree);
        const dataRef = tree.getDataRef<DndDataRef>();

        if (
          !tree.getState().dnd?.draggedItems &&
          !tree.getConfig().canDropForeignDragObject?.(e.dataTransfer, target)
        ) {
          return;
        }

        if (!canDrop(e.dataTransfer, target, tree)) {
          return;
        }

        e.preventDefault();
        const nextDragCode = getDragCode(target);

        if (nextDragCode === dataRef.current.lastDragCode) {
          return;
        }

        dataRef.current.lastDragCode = nextDragCode;

        tree.getConfig().setDndState?.((state) => ({
          ...state,
          dragTarget: target,
          draggingOverItem: item,
        }));
      },

      onDragLeave: () => {
        const dataRef = tree.getDataRef<DndDataRef>();
        dataRef.current.lastDragCode = "no-drag";
        tree.getConfig().setDndState?.((state) => ({
          ...state,
          draggingOverItem: undefined,
          dragTarget: undefined,
        }));
      },

      onDrop: (e) => {
        const dataRef = tree.getDataRef<DndDataRef>();
        const target = getDropTarget(e, item, tree);

        if (!canDrop(e.dataTransfer, target, tree)) {
          return;
        }

        e.preventDefault();
        const config = tree.getConfig();
        const draggedItems = tree.getState().dnd?.draggedItems;

        dataRef.current.lastDragCode = undefined;
        tree.getConfig().setDndState?.(null);

        if (draggedItems) {
          config.onDrop?.(draggedItems, target);
        } else {
          config.onDropForeignDragObject?.(e.dataTransfer, target);
        }
        // TODO rebuild tree?
      },
    }),

    isDropTarget: () => {
      const target = tree.getDropTarget();
      return target ? target.item.getId() === item.getId() : false;
    },

    isDropTargetAbove: () => {
      const target = tree.getDropTarget();

      if (!target || target.childIndex === null) return false;
      const targetIndex = target.item.getItemMeta().index;

      return targetIndex + target.childIndex + 1 === item.getItemMeta().index;
    },

    isDropTargetBelow: () => {
      const target = tree.getDropTarget();

      if (!target || target.childIndex === null) return false;
      const targetIndex = target.item.getItemMeta().index;

      return targetIndex + target.childIndex === item.getItemMeta().index;
    },

    isDraggingOver: () => {
      return tree.getState().dnd?.draggingOverItem?.getId() === item.getId();
    },
  }),
};
