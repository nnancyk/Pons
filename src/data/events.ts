export interface RSO {
  id: string;
  name: string;
  category: string;
  description: string;
}

export type EventStatus = "ongoing" | "canceled" | "delayed";

export type EventAccess = "members" | "open";

export interface Event {
  id: string;
  rsoName: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  status: EventStatus;
  tags: string[];
  access: EventAccess;
}

export const categories = [
  "All",
  "Academic",
  "Cultural",
  "Sports & Rec",
  "Arts",
  "Social",
  "Tech",
  "Service",
  "Professional",
];

export const sampleEvents: Event[] = [
  {
    id: "1",
    rsoName: "Husky Robotics",
    title: "Intro to ROS Workshop",
    date: "Mon, Mar 3",
    time: "6:00 PM",
    location: "CSE2 G01",
    category: "Tech",
    description: "Learn the basics of Robot Operating System in this hands-on workshop.",
    status: "ongoing",
    tags: ["workshop", "robotics", "beginner"],
    access: "open",
  },
  {
    id: "2",
    rsoName: "Filipino American Student Association",
    title: "Cultural Night Rehearsal",
    date: "Tue, Mar 4",
    time: "7:00 PM",
    location: "HUB Ballroom",
    category: "Cultural",
    description: "Join us for our annual cultural night dress rehearsal. All performers welcome!",
    status: "ongoing",
    tags: ["performance", "cultural", "rehearsal"],
    access: "members",
  },
  {
    id: "3",
    rsoName: "UW Climbing Club",
    title: "Bouldering Social",
    date: "Wed, Mar 5",
    time: "5:30 PM",
    location: "IMA Climbing Wall",
    category: "Sports & Rec",
    description: "Weekly bouldering session. All skill levels welcome, gear provided.",
    status: "ongoing",
    tags: ["climbing", "fitness", "social"],
    access: "open",
  },
  {
    id: "4",
    rsoName: "Design @ UW",
    title: "Portfolio Review Night",
    date: "Wed, Mar 5",
    time: "6:00 PM",
    location: "Art Building 003",
    category: "Arts",
    description: "Get feedback on your design portfolio from industry mentors.",
    status: "delayed",
    tags: ["design", "portfolio", "mentorship"],
    access: "open",
  },
  {
    id: "5",
    rsoName: "ACM @ UW",
    title: "Competitive Programming Practice",
    date: "Thu, Mar 6",
    time: "5:00 PM",
    location: "CSE1 305",
    category: "Academic",
    description: "Weekly practice session for ICPC-style competitive programming problems.",
    status: "ongoing",
    tags: ["programming", "competitive", "practice"],
    access: "members",
  },
  {
    id: "6",
    rsoName: "Huskies for Habitat",
    title: "Build Day Volunteer Event",
    date: "Sat, Mar 8",
    time: "9:00 AM",
    location: "Rainier Valley",
    category: "Service",
    description: "Help build affordable housing in the community. Tools and lunch provided.",
    status: "canceled",
    tags: ["volunteer", "community", "outdoor"],
    access: "open",
  },
  {
    id: "7",
    rsoName: "UW Pre-Law Society",
    title: "Mock Trial Showcase",
    date: "Fri, Mar 7",
    time: "4:00 PM",
    location: "Smith Hall 120",
    category: "Professional",
    description: "Watch our mock trial team compete in preparation for regionals.",
    status: "ongoing",
    tags: ["law", "competition", "showcase"],
    access: "members",
  },
  {
    id: "8",
    rsoName: "Husky Gaming",
    title: "Game Night Social",
    date: "Fri, Mar 7",
    time: "7:00 PM",
    location: "HUB 332",
    category: "Social",
    description: "Board games, video games, and snacks. Bring your friends!",
    status: "ongoing",
    tags: ["gaming", "social", "fun"],
    access: "open",
  },
];
