export interface EventOrg {
  orgName: string;
  orgType: string;
  orgDesc: string;
}

export interface EventLocation {
  locationName: string;
  locationRoom: string;
  locationMap: string;
}

export interface Event {
  eventID: number;
  eventName: string;
  org: EventOrg;
  eventType: string;
  status: string;
  entryReq: string;
  eventDesc: string;
  eventStart: string;
  eventEnd: string;
  isVirtual: boolean;
  virtualLink: string | null;
  location: EventLocation | null;
  tags: string[];
}

export function getLocationString(e: Event): string {
  if (e.location) {
    return `${e.location.locationName}${e.location.locationRoom ? ` ${e.location.locationRoom}` : ""}`;
  }
  return "Virtual";
}
