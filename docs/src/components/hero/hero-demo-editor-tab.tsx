import type { Framework, FrameworkDefinition } from '#lib/hero-demo';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './hero-demo-editor.module.css';

export type HeroDemoEditorTabProps = {
  activeFramework: Framework;
  frameworkDefinition: FrameworkDefinition;
  onSelect: (framework: Framework) => void;
  saving: boolean;
  typing: boolean;
};

export function HeroDemoEditorTab(props: HeroDemoEditorTabProps) {
  const { activeFramework, frameworkDefinition, onSelect, saving, typing } =
    props;

  const isActive = frameworkDefinition.id === activeFramework;
  const isDirty = isActive && (typing || saving);

  const extension = frameworkDefinition.filename.slice(
    frameworkDefinition.filename.indexOf('.') + 1,
  );

  const handleClick = () => {
    onSelect(frameworkDefinition.id);
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
        as="span"
        className={styles.TabFilenameTextShort}
      >
        {extension}
      </Box>
      <Box
        as="span"
        className={styles.TabFilenameTextFull}
      >
        {frameworkDefinition.filename}
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
