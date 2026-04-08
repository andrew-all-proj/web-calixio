import { PropsWithChildren } from 'react'
import styles from './CosmicBackdrop.module.css'

export const CosmicBackdrop = ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
