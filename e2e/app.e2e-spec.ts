import { MH5StudioPage } from './app.po';

describe('m-h5-studio App', function() {
  let page: MH5StudioPage;

  beforeEach(() => {
    page = new MH5StudioPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
