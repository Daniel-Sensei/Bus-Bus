import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { LinesPage } from './lines.page';

describe('LinesPage', () => {
  let component: LinesPage;
  let fixture: ComponentFixture<LinesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LinesPage],
      imports: [IonicModule.forRoot(), ExploreContainerComponentModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LinesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
