import clsx from 'clsx';
import { JSX, useRef } from 'react';
import useClickAway from 'react-use/lib/useClickAway';

const Modal = ({
  title,
  body,
  footer,
  isOpen,
  onClose,
}: {
  readonly title: JSX.Element;
  readonly body: JSX.Element;
  readonly footer: JSX.Element;
  readonly isOpen: boolean;
  readonly onClose: () => Promise<void>;
}) => {
  const ref = useRef(null);
  useClickAway(ref, async () => {
    if (isOpen) {
      onClose();
    }
  });

  const modalClass = clsx(
    'modal modal-bottom sm:modal-middle',
    `${isOpen ? 'modal-open' : ''}`
  );

  return (
    <div className={modalClass}>
      <div className='modal-box relative' ref={ref}>
        <button
          className='btn-sm btn-circle btn absolute right-2 top-2'
          onClick={onClose}
        >
          ✕
        </button>
        {title}
        {body}
        <div className='modal-action'>{footer}</div>
      </div>
    </div>
  );
};

export default Modal;
