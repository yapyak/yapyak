import type { Framework } from './hero-demo-editor';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './hero-demo-editor.module.css';

export type HeroDemoEditorTabProps = {
  active: boolean;
  dirty: boolean;
  filename: string;
  framework: Framework;
  onSelect: (framework: Framework) => void;
};

export function HeroDemoEditorTab(props: HeroDemoEditorTabProps) {
  const { active, dirty, filename, framework, onSelect } = props;

  const extension = filename.slice(filename.indexOf('.') + 1);

  const handleClick = () => {
    onSelect(framework);
  };

  return (
    <ButtonBase
      className={styles.TabButton}
      data-active={active}
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
        data-dirty={dirty}
      />
    </ButtonBase>
  );
}
