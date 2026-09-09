import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatNotificationsComponent } from './candidat-notifications.component';

describe('CandidatNotificationsComponent', () => {
  let component: CandidatNotificationsComponent;
  let fixture: ComponentFixture<CandidatNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatNotificationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CandidatNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
