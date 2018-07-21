import { expect } from 'chai';

import { EveTrackPage } from './app.po';

describe('client App', function() {
  let page: EveTrackPage;

  beforeEach(() => {
    page = new EveTrackPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).to.equal('app works!');
  });
});
