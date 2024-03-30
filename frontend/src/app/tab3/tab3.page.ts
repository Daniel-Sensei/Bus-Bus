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

  constructor(private routeService: RouteService) {}

  toggleCompany(company: Company) {
    this.selectedCompany = (this.selectedCompany === company) ? null : company;
  }

  search(event: CustomEvent) {
    const query = event.detail.value;
    console.log(query);
  }

}
