import TodolistComponent from "../components/todolist/todolist_component";
import SearchComponent from "../components/search/search_component";
import DoubleScreen from "@/components/ui/DoubleScreen";
import CTAComponent from "@/components/cta/CTA_component";
import HorizontalSplit from "@/components/ui/HorizontalSplit";
import EventDescriptionComponent from "@/components/event_description/event_description_component";

export default function Home() {
  return (
    <DoubleScreen
      top={
        <HorizontalSplit left={< CTAComponent />} right={<EventDescriptionComponent />} />
      }
      bottom={
        <HorizontalSplit left={< TodolistComponent />} right={<SearchComponent />} />
      }
    />
  )
}
