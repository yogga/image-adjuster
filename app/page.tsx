import ImageAdjuster from './components/image-adjuster'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4 sm:px-6 lg:px-8">
      <ImageAdjuster />
    </main>
  )
}