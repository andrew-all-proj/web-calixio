import { AuthPanel } from '@/features/auth'
import { JoinRoomCard } from '@/features/room-join'
import { CosmicBackdrop } from '@/widgets/decor'
import styles from './HomePage.module.css'

const HomePage = () => {
  return (
    <CosmicBackdrop>
      <main className={styles.main}>
        <section className={styles.grid}>
          <JoinRoomCard />
          <AuthPanel />
        </section>
      </main>
    </CosmicBackdrop>
  )
}

export default HomePage
