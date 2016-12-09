import { Ng2TrackPage } from './app.po';

describe('ng2-track App', function() {
  let page: Ng2TrackPage;

  beforeEach(() => {
    page = new Ng2TrackPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
