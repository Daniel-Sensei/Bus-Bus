import { Component } from '@angular/core';
import { RouteService } from '../service/route.service';

interface Company {
  name: string;
  lines: string[];
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'lines.page.html',
  styleUrls: ['lines.page.scss']
})
export class LinesPage {

  selectedCompany: Company | null = null;
  routes: Map<string, any[]> = new Map();
  filteredRoutes: Map<string, any[]> = new Map(); // Aggiungi un array per i dati filtrati
  loading: boolean = true; // Aggiungi una variabile per il caricamento
  selectedSegment: string = 'default'; //stops and buses

  constructor(private routeService: RouteService) { }

  /**
   * ngOnInit is a lifecycle hook that is called after the component is initialized.
   * In this function, we retrieve all routes from the RouteService and populate the
   * routes and filteredRoutes Map properties. We also set the loading property to false
   * to indicate that the data has been loaded.
   */
  ngOnInit() {
    // Retrieve all routes from the RouteService
    this.routeService.getAllRoutes().subscribe((routes: any) => {
      // Iterate over each route
      for (let route of Object.keys(routes)) {
        // Add the route to the routes Map property with its corresponding values
        this.routes.set(route, Object.values(routes[route as unknown as number]));
      }

      // Set the filteredRoutes property to the same routes as retrieved from the service
      this.filteredRoutes = routes;

      // Set the loading property to false to indicate that the data has been loaded
      this.loading = false;
    });
  }

  /**
   * Performs a search for routes based on the search term.
   * @param event - The event triggered by the search input.
   */
  search(event: Event) { // Modifica il tipo del parametro da CustomEvent a Event
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm === "") {
      // If the search term is empty, set the filteredRoutes to the routes
      this.filteredRoutes = this.routes;
      return;
    }

    // Initialize an empty Map to store the filtered routes
    this.filteredRoutes = new Map<string, any[]>();

    // Iterate over each route in the routes Map
    for (let [company, lines] of this.routes) {

      // If the company name includes the search term, add the company and lines to the filteredRoutes
      if (company.toLowerCase().includes(searchTerm)) {
        this.filteredRoutes.set(company, lines);
      } else {
        // If the company name does not include the search term, filter the lines based on the search term
        const filteredLines = lines.filter(line => line.code.toLowerCase().includes(searchTerm));

        // If there are any filtered lines, add the company and filtered lines to the filteredRoutes
        if (filteredLines.length > 0) {
          this.filteredRoutes.set(company, filteredLines);
        }
      }
    }
  }

  /**
   * Retrieves the timetable for a specific stop.
   *
   * @param {string} company - The name of the company.
   * @param {any} route - The route object.
   * @param {string} direction - The direction of the route.
   * @param {number} stopIndex - The index of the stop.
   * @return {string} The timetable for the stop, formatted as "HH:MM - HH:MM".
   */
  getStopTimetable(company: string, route: any, direction: string, stopIndex: number) {
    // Iterate over each route in the routes Map
    for (let [companyName, lines] of this.routes) {
      // Check if the company name matches the input company
      if (companyName === company) {
        // Iterate over each line in the company's lines array
        for (let line of lines) {
          // Check if the line's code matches the input route's code
          if (line.code === route.code) {
            // Return the timetable for the stop, formatted as "HH:MM - HH:MM"
            return line.timetable[direction][stopIndex].join(" - ");
          }
        }
      }
    }
  }

  clearSearch() {
    this.filteredRoutes = this.routes;
  }
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }
}
