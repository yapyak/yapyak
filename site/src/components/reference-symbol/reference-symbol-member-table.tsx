import type { HTMLAttributes, ReactElement } from 'react';
import styles from './reference-symbol-member-table.module.css';

export interface ReferenceSymbolMember {
  name: string;
  type: string;
  optional: boolean;
  description: string;
}

export interface ReferenceSymbolMemberTableProps
  extends HTMLAttributes<HTMLElement> {
  title: string;
  members: ReferenceSymbolMember[];
}

export function ReferenceSymbolMemberTable(
  props: ReferenceSymbolMemberTableProps,
): ReactElement {
  const { title, members, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbolMemberTable} ${className}`
    : styles.ReferenceSymbolMemberTable;
  return (
    <section {...restProps} className={merged}>
      <h2 className={styles.Heading}>{title}</h2>
      <table className={styles.Table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.name}>
              <td>
                <code>{member.name}</code>
                {member.optional ? (
                  <span className={styles.Optional}>?</span>
                ) : null}
              </td>
              <td>
                <code>{member.type}</code>
              </td>
              <td>{stripDashPrefix(member.description)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function stripDashPrefix(text: string): string {
  return text.startsWith('- ') ? text.slice(2) : text;
}
