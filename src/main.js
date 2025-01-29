import {
  initHomeSwipers,
  initFaqs,
  splitTextAnimation,
  initCounter,
  initNavigation,
  linkedinAdsConversion,
  initCookieModal,
  initTabs,
  initWhatYouGetAnimations,
  figmaIframeAdjust,
  initPriceCalculator,
  initStepperReferrals,
  initCopyToClipboard,
} from './index'

const getCurrentPath = () => window.location.pathname

const loadScripts = () => {
  const currentPath = getCurrentPath()

  initNavigation()
  linkedinAdsConversion()
  initCookieModal()

  if (currentPath === '/' || currentPath === '/home-new') {
    initPriceCalculator()
    initTabs()
    initHomeSwipers()
    splitTextAnimation()
    initCounter()
    initFaqs()
    initWhatYouGetAnimations()
    figmaIframeAdjust()
  }

  if (currentPath.includes('/referrals')) {
    initFaqs()
    initStepperReferrals()
    initCopyToClipboard()
  }
}

loadScripts()
