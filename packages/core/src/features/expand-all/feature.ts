import { FeatureImplementation } from "../../types/core";
import { ExpandAllFeatureDef } from "./types";
import { MainFeatureDef } from "../main/types";
import { TreeFeatureDef } from "../tree/types";
import { SyncDataLoaderFeatureDef } from "../sync-data-loader/types";
import { poll } from "../../utils";

export const expandAllFeature: FeatureImplementation<
  any,
  ExpandAllFeatureDef,
  | MainFeatureDef
  | TreeFeatureDef<any>
  | SyncDataLoaderFeatureDef<any>
  | ExpandAllFeatureDef
> = {
  key: "expand-all",
  dependingFeatures: ["main", "tree"],

  createTreeInstance: (prev, tree) => ({
    ...prev,

    expandAll: async (cancelToken) => {
      await Promise.all(
        tree.getItems().map((item) => item.expandAll(cancelToken))
      );
    },

    collapseAll: () => {
      tree.getConfig().setExpandedItems?.([]);
      tree.rebuildTree();
    },
  }),

  createItemInstance: (prev, item, tree) => ({
    ...prev,

    expandAll: async (cancelToken) => {
      if (cancelToken?.current) {
        return;
      }

      item.expand();
      await poll(() => !tree.getState().loadingItems.includes(item.getId()));
      await Promise.all(
        item.getChildren().map(async (child) => {
          await poll(
            () => !tree.getState().loadingItems.includes(child.getId())
          );
          await child?.expandAll(cancelToken);
        })
      );
    },

    collapseAll: () => {
      for (const child of item.getChildren()) {
        child?.collapseAll();
      }
      item.collapse();
    },
  }),
};
