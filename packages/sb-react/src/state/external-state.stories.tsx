import type { Meta } from "@storybook/react";
import React, { useState } from "react";
import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  TreeState,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import cx from "classnames";

const meta = {
  title: "React/State/External State",
  tags: ["guides/state", "react/state/external-state"],
} satisfies Meta;

export default meta;

// story-start
export const ExternalState = () => {
  const [state, setState] = useState<Partial<TreeState<string>>>({});

  const tree = useTree<string>({
    state,
    setState,
    rootItemId: "root",
    getItemName: (item) => item.getItemData(),
    isItemFolder: () => true,
    dataLoader: {
      getItem: (itemId) => itemId,
      getChildren: (itemId) => [`${itemId}-1`, `${itemId}-2`, `${itemId}-3`],
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
  });

  return (
    <>
      <div ref={tree.registerElement} className="tree">
        {tree.getItems().map((item) => (
          <div
            key={item.getId()}
            className="treeitem-parent"
            style={{ marginLeft: `${item.getItemMeta().level * 20}px` }}
          >
            <button
              {...item.getProps()}
              ref={item.registerElement}
              className={cx("treeitem", {
                focused: item.isFocused(),
                expanded: item.isExpanded(),
                selected: item.isSelected(),
                folder: item.isFolder(),
              })}
            >
              {item.getItemName()}
            </button>
          </div>
        ))}
      </div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </>
  );
};
