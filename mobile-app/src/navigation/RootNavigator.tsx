import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Text, View, ActivityIndicator, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useNavigation, useRoute, RouteProp, CommonActions} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {dataService} from '../services/dataService';
import {colors} from '../theme/colors';
import {generateAndUploadReport} from '../services/reportService';
import {handleAsyncError} from '../utils/errorHandler';
import {LoginScreen} from '../screens/LoginScreen';
import {DashboardScreen} from '../screens/DashboardScreen';
import {CreateInspectionScreen} from '../screens/CreateInspectionScreen';
import {CreateInvoiceScreen} from '../screens/CreateInvoiceScreen';
import {InvoicePreviewScreen} from '../screens/InvoicePreviewScreen';
import {ReportPreviewScreen} from '../screens/ReportPreviewScreen';
import {CustomersListScreen} from '../screens/CustomersListScreen';
import {CustomerDetailsScreen} from '../screens/CustomerDetailsScreen';
import {EditCustomerScreen} from '../screens/EditCustomerScreen';
import {CreateCustomerScreen} from '../screens/CreateCustomerScreen';
import {SemiAnnualReportScreen} from '../screens/SemiAnnualReportScreen';
import {InspectionHistoryScreen} from '../screens/InspectionHistoryScreen';
import {UploadPhotosScreen} from '../screens/UploadPhotosScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  CreateInspection: {customerId?: string; serviceType?: 'installation' | 'inspection' | 'maintenance'} | undefined;
  CreateInvoice: {customerId?: string} | undefined;
  InvoicePreview: {invoiceId: string};
  ReportPreview: {inspectionId: string};
  CustomersList: undefined;
  CustomerDetails: {customerId: string};
  EditCustomer: {customerId: string};
  CreateCustomer: undefined;
  SemiAnnualReport: {reportId?: string} | undefined;
  InspectionHistory: {customerId?: string};
  UploadPhotos: {inspectionId?: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderBackButton({onPress}: {onPress: () => void}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8}}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
    >
      <Text style={{color: '#007AFF', fontSize: 22, marginRight: 4, fontWeight: '300'}}>‹</Text>
      <Text style={{color: '#007AFF', fontSize: 17}}>Back</Text>
    </TouchableOpacity>
  );
}

function LoginWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <LoginScreen
      onLogin={async (email, password) => {
        const result = await dataService.signIn(email, password);
        if (result.ok) {
          nav.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{name: 'Dashboard'}],
            }),
          );
        } else {
          throw new Error(result.error);
        }
      }}
    />
  );
}

function DashboardWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [perms, setPerms] = useState({
    canCreateInstallation: true,
    canCreateInspection: true,
    canCreateInvoice: true,
  });
  useEffect(() => {
    dataService.getUserPermissions().then(p => {
      setPerms({
        canCreateInstallation: p.can_create_installation,
        canCreateInspection: p.can_create_inspection,
        canCreateInvoice: p.can_create_invoice,
      });
    });
  }, []);
  return (
    <DashboardScreen
      onNewInstallation={() => nav.navigate('CreateInspection', {serviceType: 'installation'})}
      onExistingCustomer={() => nav.navigate('CustomersList')}
      onCreateInvoice={() => nav.navigate('CreateInvoice')}
      onReport={() => nav.navigate('SemiAnnualReport')}
      onSignOut={async () => {
        await dataService.signOut();
        nav.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Login'}],
          }),
        );
      }}
      canCreateInstallation={perms.canCreateInstallation}
      canCreateInspection={perms.canCreateInspection}
      canCreateInvoice={perms.canCreateInvoice}
    />
  );
}

function CreateInspectionWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateInspection'>>();
  const customerId = route.params?.customerId;
  const serviceType = route.params?.serviceType ?? 'inspection';
  return (
        <CreateInspectionScreen
      existingCustomerId={customerId}
      serviceType={serviceType}
      onComplete={async (data, resolvedCustomerId) => {
        let inspection: {id: string} | null = null;
        try {
          const cid = resolvedCustomerId ?? customerId;
          const payload = {
            customer_id: '',
            service_type: serviceType,
            customerInfo: data.customerInfo,
            systemInfo: data.systemInfo,
            projectInfo: data.projectInfo,
            permitStatus: data.permitStatus,
            workProgress: data.workProgress,
            systemChecks: data.systemChecks,
            inspectionSetup: data.inspectionSetup,
            comments: data.comments,
            paymentInfo: data.paymentInfo,
            dynamicFieldValues: data.dynamicFieldValues,
            photos: data.photos,
          };
          if (!cid && data.customerInfo) {
            const customer = await dataService.createCustomer({
              business_name: data.customerInfo.businessName,
              customer_name: data.customerInfo.businessName,
              address: data.customerInfo.address,
              suite: data.customerInfo.suite || undefined,
              city: data.customerInfo.city,
              state: data.customerInfo.state,
              zip: data.customerInfo.zipCode,
              phone: data.customerInfo.telephone,
              email: data.customerInfo.email,
              contact_person_name: data.customerInfo.contactPersonName || undefined,
              contact_person_phone: data.customerInfo.contactPersonPhone || undefined,
              contact_person_email: data.customerInfo.contactPersonEmail || undefined,
            });
            if (!customer) {
              nav.navigate('Dashboard');
              return;
            }
            payload.customer_id = customer.id;
          } else if (cid) {
            payload.customer_id = cid;
          } else {
            nav.navigate('Dashboard');
            return;
          }

          inspection = await dataService.createInspection(payload);
          if (
            (serviceType === 'inspection' || serviceType === 'maintenance') &&
            inspection?.id
          ) {
            // Photos and report upload are best-effort; don't block on failure
            let photosForReport: Array<{uri: string}> = [];
            try {
              for (const photo of data.photos ?? []) {
                if (photo.uri) {
                  const url = await dataService.uploadInspectionPhoto(inspection!.id, {
                    uri: photo.uri,
                    type: photo.type ?? 'image/jpeg',
                    name: photo.name ?? 'photo.jpg',
                  });
                  if (url) photosForReport.push({uri: url});
                }
              }
            } catch {
              // Photos failed; continue with local URIs for report if possible
            }
            try {
              const reportUrl = await generateAndUploadReport(
                inspection.id,
                {...data, photos: photosForReport},
                serviceType,
              );
              if (reportUrl) {
                await dataService.updateInspectionReportUrl(inspection.id, reportUrl);
              }
            } catch {
              // Report upload failed; inspection is still saved, user can retry from ReportPreview
            }
            nav.replace('ReportPreview', {inspectionId: inspection.id});
          } else {
            nav.navigate('Dashboard');
          }
        } catch (e) {
          handleAsyncError(e, 'Inspection Failed', 'Could not save the inspection. Please try again.');
          nav.navigate('Dashboard');
        }
      }}
      onCancel={() => nav.goBack()}
    />
  );
}

function CreateInvoiceWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateInvoice'>>();
  const customerId = route.params?.customerId;
  return (
    <CreateInvoiceScreen
      preselectedCustomerId={customerId}
      onComplete={(invoiceId) => nav.replace('InvoicePreview', {invoiceId})}
      onCancel={() => nav.goBack()}
    />
  );
}

function InvoicePreviewWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'InvoicePreview'>>();
  const {invoiceId} = route.params;
  return (
    <InvoicePreviewScreen
      invoiceId={invoiceId}
      onDone={() => nav.navigate('Dashboard')}
    />
  );
}

function ReportPreviewWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ReportPreview'>>();
  const {inspectionId} = route.params;
  return (
    <ReportPreviewScreen
      inspectionId={inspectionId}
      onDone={() => nav.navigate('Dashboard')}
      onAddPhotos={() => nav.navigate('UploadPhotos', {inspectionId})}
    />
  );
}

function CustomersListWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <CustomersListScreen
      onSelectCustomer={c => nav.navigate('CustomerDetails', {customerId: c.id})}
    />
  );
}

function CreateCustomerWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <CreateCustomerScreen
      onComplete={(customerId) => nav.navigate('CustomerDetails', {customerId})}
      onCancel={() => nav.goBack()}
    />
  );
}

function SemiAnnualReportWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SemiAnnualReport'>>();
  const reportId = route.params?.reportId;
  return (
    <SemiAnnualReportScreen
      reportId={reportId}
      onComplete={() => nav.goBack()}
      onCancel={() => nav.goBack()}
    />
  );
}

function EditCustomerWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditCustomer'>>();
  const {customerId} = route.params;
  return (
    <EditCustomerScreen
      customerId={customerId}
      onComplete={() => nav.goBack()}
      onCancel={() => nav.goBack()}
    />
  );
}

function CustomerDetailsWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CustomerDetails'>>();
  const {customerId} = route.params;
  return (
    <CustomerDetailsScreen
      customerId={customerId}
      onEdit={() => nav.navigate('EditCustomer', {customerId})}
      onBack={() => nav.goBack()}
      onNewInspection={() => nav.navigate('CreateInspection', {customerId, serviceType: 'inspection'})}
      onNewMaintenance={() => nav.navigate('CreateInspection', {customerId, serviceType: 'maintenance'})}
      onNewInstallation={() => nav.navigate('CreateInspection', {customerId, serviceType: 'installation'})}
      onInspectionHistory={() => nav.navigate('InspectionHistory', {customerId})}
    />
  );
}

function InspectionHistoryWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'InspectionHistory'>>();
  return (
    <InspectionHistoryScreen
      customerId={route.params?.customerId}
      onSelectInspection={(inspection) =>
        nav.navigate('ReportPreview', {inspectionId: inspection.id})
      }
      onBack={() => nav.goBack()}
    />
  );
}

function UploadPhotosWrapper() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'UploadPhotos'>>();
  return (
    <UploadPhotosScreen
      inspectionId={route.params?.inspectionId}
      onBack={() => nav.goBack()}
      onComplete={() => nav.goBack()}
    />
  );
}

function AuthGate(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    dataService.getSession().then(session => {
      setHasSession(Boolean(session));
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <View style={authStyles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerLargeTitle: true,
        headerStyle: {backgroundColor: '#FFFFFF'},
        headerTintColor: '#333333',
        presentation: 'fullScreenModal', // Force full screen on iPad
        contentStyle: {flex: 1}, // Ensure content fills screen
      }}
      initialRouteName={hasSession ? 'Dashboard' : 'Login'}>
      <Stack.Screen
        name="Login"
        component={LoginWrapper}
        options={{
          title: 'Fire Inspection',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardWrapper}
        options={({navigation}) => ({
          title: 'Fire Inspection',
          headerBackVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateCustomer')}
              style={{paddingHorizontal: 16, paddingVertical: 8}}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <Text style={{color: colors.accent, fontSize: 17, fontWeight: '600'}}>
                + New Customer
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="CreateInvoice"
        component={CreateInvoiceWrapper}
        options={({navigation}) => ({
          title: 'Create Invoice',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="InvoicePreview"
        component={InvoicePreviewWrapper}
        options={({navigation}) => ({
          title: 'Invoice',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="ReportPreview"
        component={ReportPreviewWrapper}
        options={({navigation}) => ({
          title: 'Report',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="CreateInspection"
        component={CreateInspectionWrapper}
        options={({navigation, route}) => {
          const serviceType = (route.params as {serviceType?: string})?.serviceType ?? 'inspection';
          const titles: Record<string, string> = {
            installation: 'New Installation',
            inspection: 'New Inspection',
            maintenance: 'New Maintenance',
          };
          return {
          title: titles[serviceType] ?? 'New Inspection',
          headerShown: true,
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        };
        }}
      />
      <Stack.Screen
        name="CustomersList"
        component={CustomersListWrapper}
        options={({navigation}) => ({
          title: 'Customers',
          headerShown: true,
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateInspection', {serviceType: 'installation'})}
              style={{paddingHorizontal: 16, paddingVertical: 8}}
            >
              <Text style={{color: '#007AFF', fontSize: 17, fontWeight: '500'}}>+ New Customer</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="CreateCustomer"
        component={CreateCustomerWrapper}
        options={({navigation}) => ({
          title: 'New Customer',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="SemiAnnualReport"
        component={SemiAnnualReportWrapper}
        options={({navigation}) => ({
          title: 'Inspection Report',
          headerTitle: 'Inspection Report',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="EditCustomer"
        component={EditCustomerWrapper}
        options={({navigation}) => ({
          title: 'Edit Customer',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="CustomerDetails"
        component={CustomerDetailsWrapper}
        options={({navigation}) => ({
          title: 'Customer Details',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="InspectionHistory"
        component={InspectionHistoryWrapper}
        options={({navigation}) => ({
          title: 'Inspection History',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
      <Stack.Screen
        name="UploadPhotos"
        component={UploadPhotosWrapper}
        options={({navigation}) => ({
          title: 'Upload Photos',
          headerBackVisible: false,
          headerLargeTitle: false,
          headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
        })}
      />
    </Stack.Navigator>
  );
}

const authStyles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export function RootNavigator(): React.JSX.Element {
  return <AuthGate />;
}
