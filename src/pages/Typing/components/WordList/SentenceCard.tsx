import type { SentenceItem } from '@/typings'

export default function SentenceCard({ sentence, isActive, onClick }: { sentence: SentenceItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`mb-2 flex w-full flex-col items-start rounded-xl p-4 text-left shadow focus:outline-none ${
        isActive ? 'bg-indigo-50 dark:bg-indigo-800 dark:bg-opacity-20' : 'bg-white dark:bg-gray-700 dark:bg-opacity-20'
      }`}
      onClick={onClick}
    >
      <p className="w-full truncate font-mono text-lg font-normal leading-6 dark:text-gray-50">{sentence.text}</p>
      <p className="mt-2 w-full truncate font-sans text-sm text-gray-400">{sentence.trans}</p>
    </button>
  )
}
