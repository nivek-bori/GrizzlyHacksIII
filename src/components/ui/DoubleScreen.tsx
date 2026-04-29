export default function DoubleScreen({ top, bottom }: { top: React.ReactNode, bottom: React.ReactNode }) {
  return (
    <div className='w-full'>
      <div className='w-full h-screen'>
        {top}
      </div>
      <div className='w-full h-screen'>
        {bottom}
      </div>
    </div>
  )
}