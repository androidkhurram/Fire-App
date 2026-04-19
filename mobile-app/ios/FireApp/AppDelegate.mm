#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBundleURLProvider.h>

// HtmlToPdf pod marks headers private only (Pods/Headers/Public has no copy), so
// angle-bracket <HtmlToPdf/HtmlToPdf.h> never resolves for the app target and
// __has_include was always false — the force-link below was stripped from the binary.
#import "../Pods/Headers/Private/HtmlToPdf/HtmlToPdf.h"

@implementation AppDelegate

// RCTRegisterModule uses dispatch_barrier_async; +load can return before HtmlToPdf is
// appended to RCTModuleClasses. The bridge snapshots that list immediately after
// registerExtraModules, so the module can be missing from NativeModules on device.
// Supplying it here registers before that snapshot (see RCTCxxBridge start).
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  (void)bridge;
  return @[[HtmlToPdf new]];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Pull symbol into main target so +load / RCT_EXPORT_MODULE runs on device.
  (void)[HtmlToPdf class];
  self.moduleName = @"FireApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
