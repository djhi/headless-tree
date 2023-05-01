import {
  FeatureImplementation,
  ItemInstance,
  TreeConfig,
  TreeInstance,
  TreeState,
} from "../types/core";
import { MainFeatureDef } from "../features/main/types";
import { treeFeature } from "../features/tree/feature";

export const createTree = <T>(
  initialConfig: TreeConfig<T>
): TreeInstance<T> => {
  const additionalFeatures = [treeFeature, ...(initialConfig.features ?? [])];
  let state = additionalFeatures.reduce(
    (acc, feature) => feature.getInitialState?.(acc) ?? acc,
    initialConfig.state ?? {}
  ) as TreeState<T>;
  let config = additionalFeatures.reduce(
    (acc, feature) => feature.getDefaultConfig?.(acc) ?? acc,
    initialConfig
  ) as TreeConfig<T>;

  const treeInstance: TreeInstance<T> = {} as any;
  let treeElement: HTMLElement | undefined | null;

  const itemInstancesMap: Record<string, ItemInstance<T>> = {};
  let itemInstances: ItemInstance<T>[] = [];
  const itemElementsMap: Record<string, HTMLElement | undefined | null> = {};

  const rebuildItemInstances = () => {
    itemInstances = [];
    for (const item of treeInstance.getItemsMeta()) {
      const itemInstance = {} as ItemInstance<T>;
      for (const feature of additionalFeatures) {
        Object.assign(
          itemInstance,
          feature.createItemInstance?.(
            { ...itemInstance },
            itemInstance,
            item,
            treeInstance
          ) ?? {}
        );
      }
      itemInstancesMap[item.itemId] = itemInstance;
      itemInstances.push(itemInstance);
    }
  };

  const eachFeature = (fn: (feature: FeatureImplementation<any>) => void) => {
    for (const feature of additionalFeatures) {
      fn(feature);
    }
  };

  const mainFeature: FeatureImplementation<T, MainFeatureDef<T>> = {
    key: "main",
    createTreeInstance: (prev) => ({
      ...prev,
      getState: () => state,
      setState: (updater) => {
        state = typeof updater === "function" ? updater(state) : updater;
        config.onStateChange?.(state);
        rebuildItemInstances();
        eachFeature((feature) => feature.onStateChange?.(treeInstance));
        eachFeature((feature) => feature.onStateOrConfigChange?.(treeInstance));
      },
      getConfig: () => config,
      setConfig: (updater) => {
        config = typeof updater === "function" ? updater(config) : updater;
        eachFeature((feature) => feature.onConfigChange?.(treeInstance));
        eachFeature((feature) => feature.onStateOrConfigChange?.(treeInstance));
      },
      getItemInstance: (itemId) => itemInstancesMap[itemId],
      getItems: () => itemInstances,
      registerElement: (element) => {
        if (treeElement && !element) {
          eachFeature((feature) =>
            feature.onTreeUnmount?.(treeInstance, treeElement!)
          );
        } else if (!treeElement && element) {
          eachFeature((feature) =>
            feature.onTreeMount?.(treeInstance, element)
          );
        }
        treeElement = element;
      },
      getElement: () => treeElement,
    }),
    createItemInstance: (prev, instance, itemMeta) => ({
      ...prev,
      registerElement: (element) => {
        const oldElement = itemElementsMap[itemMeta.itemId];
        if (oldElement && !element) {
          eachFeature((feature) =>
            feature.onItemUnmount?.(instance, oldElement!, treeInstance)
          );
        } else if (!oldElement && element) {
          eachFeature((feature) =>
            feature.onItemMount?.(instance, element!, treeInstance)
          );
        }
        itemElementsMap[itemMeta.itemId] = element;
      },
      getElement: () => itemElementsMap[itemMeta.itemId],
    }),
  };

  // todo sort features
  const features = [mainFeature, ...additionalFeatures];

  for (const feature of features) {
    Object.assign(
      treeInstance,
      feature.createTreeInstance?.({ ...treeInstance }, treeInstance) ?? {}
    );
  }

  rebuildItemInstances();

  return treeInstance;
};
