import { Component } from '@angular/core';

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

  companies: Company[] = [
    {
      name: 'Azienda A',
      lines: ['121', '122', '138']
    },
    {
      name: 'Azienda B',
      lines: ['10', '11']
    }
  ];

  selectedCompany: Company | null = null;

  constructor() {}

  toggleCompany(company: Company) {
    this.selectedCompany = (this.selectedCompany === company) ? null : company;
  }

  search(event: CustomEvent) {
    const query = event.detail.value;
    console.log(query);
  }

}
