import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './member-table.module.css';

export interface ReferenceSymbolMember {
  description: string;
  name: string;
  optional: boolean;
  type: string;
}

export interface ReferenceSymbolMemberTableProps extends BoxProps<'section'> {
  members: ReferenceSymbolMember[];
  title: string;
}

export function ReferenceSymbolMemberTable(
  props: ReferenceSymbolMemberTableProps,
) {
  const { className, members, title, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolMemberTable, className]}
    >
      <Box
        as="h2"
        className={styles.Heading}
      >
        {title}
      </Box>
      <Box
        as="table"
        className={styles.Table}
      >
        <Box as="thead">
          <Box as="tr">
            <Box as="th">Name</Box>
            <Box as="th">Type</Box>
            <Box as="th">Description</Box>
          </Box>
        </Box>
        <Box as="tbody">
          {members.map((member) => (
            <Box
              as="tr"
              key={member.name}
            >
              <Box as="td">
                <Box as="code">{member.name}</Box>
                {member.optional && (
                  <Box
                    as="span"
                    className={styles.Optional}
                  >
                    ?
                  </Box>
                )}
              </Box>
              <Box as="td">
                <Box as="code">{member.type}</Box>
              </Box>
              <Box as="td">{stripDashPrefix(member.description)}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function stripDashPrefix(text: string): string {
  return text.startsWith('- ') ? text.slice(2) : text;
}
