import React from "react";
import * as S from "./style";

interface Props {
  title: string;
  itemName: string;
  items: { name: string; _id: string }[];
  callback: (id: string) => void;
  selectedItem: string;
  callbackOnNewItem: (inputValue: string) => void;
}

const SidebarList: React.FC<Props> = ({
  title,
  itemName,
  items,
  callback,
  selectedItem,
  callbackOnNewItem,
}) => {
  const onEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      callbackOnNewItem(event.currentTarget.value);
    }
  };

  return (
    <S.StyledSidebar>
      <S.SidebarTitle>{title}</S.SidebarTitle>
      <S.ItemList>
        {items.map((item) => (
          <S.StyledItem
            key={item._id}
            onClick={() => callback(item._id)}
            isSelected={selectedItem == item._id}
          >
            {item.name}
          </S.StyledItem>
        ))}
        <S.StyledItem isSelected={false}>
          <S.InputItem placeholder={`New ${itemName}...`} onKeyDown={onEnter} />
        </S.StyledItem>
      </S.ItemList>
    </S.StyledSidebar>
  );
};

export default SidebarList;
