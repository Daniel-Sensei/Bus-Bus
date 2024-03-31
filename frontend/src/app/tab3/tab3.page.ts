import { Component } from '@angular/core';
import { RouteService } from '../service/route.service';

interface Company {
  name: string;
  lines: string[];
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  selectedCompany: Company | null = null;
  routes: any[] = [];
  loading: boolean = true; // Aggiungi una variabile per il caricamento

  constructor(private routeService: RouteService) {}

  ngOnInit() {
    this.routeService.getAllRoutes().subscribe((routes: any) => {
      console.log(routes);  
      this.routes = routes;
      this.loading = false; // Imposta il caricamento su false una volta scaricati i dati
    });
  }

  search(event: CustomEvent) {
    const query = event.detail.value;
    console.log(query);
  }

}
