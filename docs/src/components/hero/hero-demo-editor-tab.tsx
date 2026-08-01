import type { Framework, FrameworkDefinition } from '#lib/hero-demo';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './hero-demo-editor-tab.module.css';

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

  const isActive = frameworkDefinition.framework === activeFramework;
  const isDirty = isActive && (typing || saving);

  const extension = frameworkDefinition.filename.slice(
    frameworkDefinition.filename.indexOf('.') + 1,
  );

  const handleClick = () => {
    onSelect(frameworkDefinition.framework);
  };

  return (
    <ButtonBase
      className={styles.HeroDemoEditorTab}
      data-active={isActive}
      data-dirty={isDirty}
      data-saving={saving}
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
      />
    </ButtonBase>
  );
}
