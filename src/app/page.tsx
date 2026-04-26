import TodolistComponent from "../components/todolist/TodolistComponent";
import SearchComponent from "../components/search/SearchComponent";

export default function Home() {
  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden">
      {/* left half */}
      <div className={`absolute inset-y-0 z-10 flex w-1/2 min-h-0 flex-col overflow-hidden`}>
        <TodolistComponent />
      </div>
      
      {/* right half */}
      <div className="absolute inset-y-0 right-0 z-0 flex w-1/2 min-h-0 flex-col overflow-hidden">
        <SearchComponent />
      </div>
    </div>
  )
}
