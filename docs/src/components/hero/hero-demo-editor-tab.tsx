import type { HeroDemoFramework } from './hero-demo-editor';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './hero-demo-editor.module.css';

export type HeroDemoEditorTabProps = {
  activeFramework: HeroDemoFramework;
  filename: string;
  framework: HeroDemoFramework;
  onSelect: (framework: HeroDemoFramework) => void;
  saving: boolean;
  typing: boolean;
};

export function HeroDemoEditorTab(props: HeroDemoEditorTabProps) {
  const { activeFramework, filename, framework, onSelect, saving, typing } =
    props;

  const isActive = framework === activeFramework;
  const isDirty = isActive && (typing || saving);

  const extension = filename.slice(filename.indexOf('.') + 1);

  const handleClick = () => {
    onSelect(framework);
  };

  return (
    <ButtonBase
      className={styles.TabButton}
      data-active={isActive}
      onClick={handleClick}
    >
      <Box
        aria-hidden="true"
        className={styles.TabFill}
      />
      <Box
        aria-hidden="true"
        className={styles.TabActiveIndicator}
      />
      <Box
        as="span"
        className={styles.TabFilenameTextShort}
      >
        {extension}
      </Box>
      <Box
        as="span"
        className={styles.TabFilenameTextFull}
      >
        {filename}
      </Box>
      <Box
        aria-hidden="true"
        as="span"
        className={styles.TabDot}
        data-dirty={isDirty}
      />
    </ButtonBase>
  );
}
