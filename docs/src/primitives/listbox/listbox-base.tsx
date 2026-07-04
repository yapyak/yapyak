import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';
import type { BoxProps } from '../box';

import { useEffect, useId, useRef } from 'react';

import { KEY_MAP } from '#constants';
import { useControllableState } from '#hooks/use-controllable-state';

import { Box } from '../box';
import { ListboxContext } from './listbox-context';

const OPTION_SELECTOR = '[role="option"]';
const TYPEAHEAD_TIMEOUT = 500;

export type ListboxOrientation = 'horizontal' | 'vertical';

export type ListboxBaseProps = Omit<BoxProps, 'defaultValue' | 'onChange'> & {
  defaultHighlight?: null | string;
  defaultValue?: null | string;
  highlight?: null | string;
  highlightOnHover?: boolean;
  onChange?: (value: string) => void;
  onHighlightChange?: (value: null | string) => void;
  orientation?: ListboxOrientation;
  value?: null | string;
};

export function ListboxBase(props: ListboxBaseProps) {
  const {
    children,
    defaultHighlight = null,
    defaultValue = null,
    highlight,
    highlightOnHover = true,
    id,
    orientation = 'vertical',
    value,
    onChange,
    onHighlightChange,
    ...restProps
  } = props;

  const generatedId = useId();
  const listboxId = id ?? generatedId;
  const element = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef({
    buffer: '',
    timeout: 0,
  });

  const [highlightedValueState, setHighlightedValue] = useControllableState<
    null | string
  >({
    defaultValue: defaultHighlight,
    onChange: onHighlightChange,
    value: highlight,
  });
  const highlightedValue = highlightedValueState ?? null;

  const [selectedValueState, setSelectedValue] = useControllableState<
    null | string
  >({
    defaultValue,
    value,
  });
  const selectedValue = selectedValueState ?? null;

  const getOptionId = (optionValue: string) =>
    `${listboxId}-option-${optionValue}`;

  const readOptionElements = () => {
    if (element.current === null) {
      return [];
    }
    return Array.from(
      element.current.querySelectorAll<HTMLElement>(OPTION_SELECTOR),
    ).filter((optionElement) => optionElement.ariaDisabled !== 'true');
  };

  const readValues = () =>
    readOptionElements()
      .map((optionElement) => optionElement.dataset.value)
      .filter((optionValue) => optionValue !== undefined);

  const highlightValue = (nextValue: null | string) => {
    setHighlightedValue(nextValue);
  };

  const select = (nextValue: string) => {
    setSelectedValue(nextValue);
    onChange?.(nextValue);
  };

  const stepHighlight = (direction: 'first' | 'last' | 'next' | 'previous') => {
    const values = readValues();
    if (values.length === 0) {
      return;
    }
    const currentIndex =
      highlightedValue === null ? -1 : values.indexOf(highlightedValue);

    let nextIndex = currentIndex;
    if (direction === 'first') {
      nextIndex = 0;
    } else if (direction === 'last') {
      nextIndex = values.length - 1;
    } else if (direction === 'next') {
      nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
    } else {
      nextIndex = currentIndex === -1 ? values.length - 1 : currentIndex - 1;
    }

    const nextValue =
      values[Math.max(0, Math.min(values.length - 1, nextIndex))];
    if (nextValue !== undefined) {
      highlightValue(nextValue);
    }
  };

  const pageHighlight = (direction: 'down' | 'up') => {
    const optionElements = readOptionElements();
    if (element.current === null || optionElements.length === 0) {
      return;
    }
    const currentIndex = optionElements.findIndex(
      (optionElement) => optionElement.dataset.value === highlightedValue,
    );
    const fromIndex =
      currentIndex === -1
        ? direction === 'up'
          ? optionElements.length - 1
          : 0
        : currentIndex;
    const fromElement = optionElements[fromIndex];
    if (fromElement === undefined) {
      return;
    }

    const viewport = element.current.clientHeight;
    const fromTop = fromElement.offsetTop;
    let targetIndex = fromIndex;
    if (direction === 'down') {
      const pageBottom = fromTop + viewport - fromElement.offsetHeight;
      for (let index = fromIndex + 1; index < optionElements.length; index++) {
        targetIndex = index;
        if ((optionElements[index]?.offsetTop ?? 0) >= pageBottom) {
          break;
        }
      }
    } else {
      const pageTop = Math.max(
        0,
        fromTop + fromElement.offsetHeight - viewport,
      );
      for (let index = fromIndex - 1; index >= 0; index--) {
        targetIndex = index;
        if ((optionElements[index]?.offsetTop ?? 0) <= pageTop) {
          break;
        }
      }
    }

    const targetValue = optionElements[targetIndex]?.dataset.value;
    if (targetValue !== undefined) {
      highlightValue(targetValue);
    }
  };

  const typeahead = (key: string) => {
    window.clearTimeout(typeaheadRef.current.timeout);
    typeaheadRef.current.buffer += key;
    typeaheadRef.current.timeout = window.setTimeout(() => {
      typeaheadRef.current.buffer = '';
    }, TYPEAHEAD_TIMEOUT);

    const query = typeaheadRef.current.buffer.toLowerCase();
    const match = readOptionElements().find((optionElement) =>
      (optionElement.textContent ?? '').trim().toLowerCase().startsWith(query),
    );
    if (match?.dataset.value !== undefined) {
      highlightValue(match.dataset.value);
    }
  };

  const findOptionValue = (target: EventTarget) => {
    if (!(target instanceof HTMLElement)) {
      return undefined;
    }
    const optionElement = target.closest<HTMLElement>(OPTION_SELECTOR);
    if (optionElement === null || optionElement.ariaDisabled === 'true') {
      return undefined;
    }
    return optionElement.dataset.value;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const isVertical = orientation === 'vertical';
    const { key } = event;

    if (key === KEY_MAP.enter || key === KEY_MAP.space) {
      if (highlightedValue !== null) {
        event.preventDefault();
        select(highlightedValue);
      }
      return;
    }

    if (key === KEY_MAP.home) {
      event.preventDefault();
      stepHighlight('first');
      return;
    }
    if (key === KEY_MAP.end) {
      event.preventDefault();
      stepHighlight('last');
      return;
    }
    if (key === KEY_MAP.pageUp) {
      event.preventDefault();
      pageHighlight('up');
      return;
    }
    if (key === KEY_MAP.pageDown) {
      event.preventDefault();
      pageHighlight('down');
      return;
    }
    if (
      (isVertical && key === KEY_MAP.up) ||
      (!isVertical && key === KEY_MAP.left)
    ) {
      event.preventDefault();
      stepHighlight('previous');
      return;
    }
    if (
      (isVertical && key === KEY_MAP.down) ||
      (!isVertical && key === KEY_MAP.right)
    ) {
      event.preventDefault();
      stepHighlight('next');
      return;
    }
    if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      typeahead(key);
    }
  };

  const handleFocus = (event: FocusEvent) => {
    if (event.target !== event.currentTarget || highlightedValue !== null) {
      return;
    }
    if (selectedValue !== null && readValues().includes(selectedValue)) {
      highlightValue(selectedValue);
    } else {
      stepHighlight('first');
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }
    const optionValue = findOptionValue(event.target);
    if (optionValue !== undefined) {
      select(optionValue);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!highlightOnHover) {
      return;
    }
    const optionValue = findOptionValue(event.target);
    if (optionValue !== undefined) {
      highlightValue(optionValue);
    }
  };

  useEffect(() => {
    if (highlightedValue === null) {
      return;
    }
    const optionElement = window.document.getElementById(
      getOptionId(highlightedValue),
    );
    optionElement?.scrollIntoView({
      block: 'nearest',
    });
  });

  const highlightedId =
    highlightedValue === null ? undefined : getOptionId(highlightedValue);

  return (
    <Box
      {...restProps}
      aria-activedescendant={highlightedId}
      aria-orientation={orientation}
      id={listboxId}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      ref={element}
      role="listbox"
      tabIndex={0}
    >
      <ListboxContext
        value={{
          getOptionId,
          highlightedValue,
          selectedValue,
        }}
      >
        {children}
      </ListboxContext>
    </Box>
  );
}
