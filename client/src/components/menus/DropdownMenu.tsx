import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  RefObject,
  forwardRef,
} from "react";
import css from "./DropdownMenu.module.css";
import { mergeRefs } from "../../helpers";
import { getElementLeft, getElementTop } from "../../helpers/domFunctions";

type JsxPropsT = {
  className?: string;
  show: boolean;
  caption?: string;
  onClose?: Function;
  children?: React.ReactNode;
  closeOnClick?: boolean;
};

const DropdownMenu = forwardRef<HTMLDivElement, JsxPropsT>((props, ref) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowMenu(props.show);
  }, [props.show]);

  function closeHandler(evt: any) {
    if (
      !props.closeOnClick &&
      !(evt.target as HTMLElement).classList.contains("btn-close")
    ) {
      return;
    }

    setShowMenu(false);
    if (props.onClose) props.onClose();
  }

  useLayoutEffect(() => {
    if (menuNodeRef.current && menuNodeRef.current.parentElement) {
      const menuNode = menuNodeRef.current as HTMLDivElement;
      const menuStyle = window.getComputedStyle(menuNode);
      const parentNode = menuNodeRef.current.parentElement;
      const parentNodeStyle = window.getComputedStyle(parentNode);

      const menuWidth = +menuStyle.width.replace("px", "");
      //const parentWidth = +parentNodeStyle.width.replace("px", "");
      const menuHeight = +menuStyle.height.replace("px", "");
      //const parentHeight = +parentNodeStyle.height.replace("px", "");
      const offsetLeft = getElementLeft(menuNode);
      const offsetTop = getElementTop(menuNode);

      let moveX = 0,
        moveY = 0;

      if (window.innerWidth < offsetLeft + menuWidth) {
        moveX = -5 - offsetLeft - menuWidth + window.innerWidth;
      } else if (window.innerHeight < offsetTop + menuHeight) {
        moveY = -5 - offsetTop - menuHeight + window.innerHeight;
      }
      menuNode.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
  });

  return (
    <div
      className={
        "dropdown-menu " +
        css.menu +
        " " +
        props.className +
        (showMenu ? " show" : "")
      }
      ref={mergeRefs(ref, menuNodeRef)}
    >
      <header>
        <span>{props.caption}</span>
        <button className="btn-close btn shadow-none" onClick={closeHandler} />
      </header>
      <div onClick={closeHandler}>{props.children}</div>
    </div>
  );
});

export default DropdownMenu;
