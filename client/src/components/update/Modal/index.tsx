import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./modal.css";

const ModalTemplate: React.FC<
  React.PropsWithChildren<{
    title?: ReactNode;
    footer?: ReactNode;
    cancelText?: string;
    okText?: string;
    onCancel?: () => void;
    onOk?: () => void;
    width?: number;
  }>
> = (props) => {
  const {
    title,
    children,
    footer,
    cancelText = "Cancel",
    okText = "OK",
    onCancel,
    onOk,
    width = 530,
  } = props;

  return (
    <div className="update-modal">
      <div className="update-modal__mask" />
      <div className="update-modal__warp">
        <div className="update-modal__content" style={{ width }}>
          <div className="content__header">
            <div className="content__header-text">{title}</div>
            <span className="update-modal--close" onClick={onCancel}>
              <svg
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="currentColor"></path>
              </svg>
            </span>
          </div>
          <div className="content__body">{children}</div>
          {typeof footer !== "undefined" ? (
            <div className="content__footer">
              <button onClick={onCancel}>{cancelText}</button>
              <button onClick={onOk}>{okText}</button>
            </div>
          ) : (
            footer
          )}
        </div>
      </div>
    </div>
  );
};

const Modal = (
  props: Parameters<typeof ModalTemplate>[0] & { open: boolean },
) => {
  const { open, ...omit } = props;

  return createPortal(open ? ModalTemplate(omit) : null, document.body);
};

export default Modal;
