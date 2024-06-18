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
  routes: Map<string,any[]> = new Map();
  filteredRoutes: Map<string,any[]> = new Map(); // Aggiungi un array per i dati filtrati
  loading: boolean = true; // Aggiungi una variabile per il caricamento
  selectedSegment: string = 'default'; //stops and buses

  constructor(private routeService: RouteService) {}

  ngOnInit() {
    this.routeService.getAllRoutes().subscribe((routes: any) => {
      console.log(routes);  
      for (let route of Object.keys(routes)) {
        this.routes.set(route, Object.values(routes[route as unknown as number]));
      }
      this.filteredRoutes = routes;
      this.loading = false; // Imposta il caricamento su false una volta scaricati i dati
      console.log("routes: ", this.routes);
      console.log("filteredRoutes: ", this.filteredRoutes);
    });
  }

  search(event: Event) { // Modifica il tipo del parametro da CustomEvent a Event
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if(searchTerm === "") {
      this.filteredRoutes = this.routes;
      return;
    }

    this.filteredRoutes = new Map<string, any[]>();
    for(let [company, lines] of this.routes) {

      if(company.toLowerCase().includes(searchTerm)) {
        this.filteredRoutes.set(company, lines);
      } else {
        const filteredLines = lines.filter(line => line.code.toLowerCase().includes(searchTerm));
        if(filteredLines.length > 0) {
          this.filteredRoutes.set(company, filteredLines);
        }
      }
    }
  }



getStopTimetable(company: string, route: any, direction: string, stopIndex: number) {
  //find route in this.routes
  for(let [companyName, lines] of this.routes) {
    if(companyName === company) {
      for(let line of lines) {
        if(line.code === route.code) {
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
