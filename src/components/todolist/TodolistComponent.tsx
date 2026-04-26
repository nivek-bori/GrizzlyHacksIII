export default function TodolistComponent() {
  
  return (
    
    <div>
      <h1>To-Do List</h1>
      <div className="bg-[#BBADA0] rounded-lg p-8">
        <input className="px-2.5 py-2.5 text-xl font-bold rounded-md border focus:outline-2 focus:outline-offset-2 bg-[#0B1D51] text-[#FFFFFF] focus:outline-[#aaaaaa] border-[#cccccc]" placeholder="Describe your event to AI" />
      </div>
    </div>
  );
}