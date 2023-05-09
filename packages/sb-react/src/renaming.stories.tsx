import type { Meta } from "@storybook/react";
import React from "react";
import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  searchFeature,
  renamingFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";

const meta = {
  title: "React/Renaming",
} satisfies Meta;

export default meta;

export const Renaming = () => {
  const tree = useTree<string>({
    rootItemId: "root",
    getItemName: (item) => item,
    isItemFolder: () => true,
    dataLoader: {
      getItem: (itemId) => itemId,
      getChildren: (itemId) => [`${itemId}-1`, `${itemId}-2`, `${itemId}-3`],
    },
    onRename: (item, value) => {
      alert(`Renamed ${item.getItemName()} to ${value}`);
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      searchFeature,
      renamingFeature,
    ],
  });

  return (
    <>
      {tree.isSearchOpen() && (
        <input
          {...tree.getSearchInputElementProps()}
          ref={tree.registerSearchInputElement}
        />
      )}{" "}
      <div ref={tree.registerElement} className="tree">
        {tree.getItems().map((item) => (
          <div
            key={item.getId()}
            className="treeitem-parent"
            style={{ marginLeft: `${item.getItemMeta().level * 20}px` }}
          >
            {item.isRenaming() ? (
              <div className="treeitem">
                <input
                  {...item.getRenameInputProps()}
                  ref={(i) => i?.focus()}
                />
              </div>
            ) : (
              <button
                {...item.getProps()}
                ref={item.registerElement}
                className="treeitem"
                data-focused={item.isFocused()}
                data-expanded={item.isExpanded()}
                data-selected={item.isSelected()}
                data-searchmatch={item.isMatchingSearch()}
              >
                {item.isExpanded() ? "v " : "> "}
                {item.getItemName()}
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => tree.startRenamingItem("root-2")}>
        Rename root-2
      </button>{" "}
      or press F2 when an item is focused.
    </>
  );
};
