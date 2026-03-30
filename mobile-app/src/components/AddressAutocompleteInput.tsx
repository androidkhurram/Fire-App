/**
 * Address autocomplete - LocationIQ (primary, free) or Google Places (fallback)
 * Set LOCATIONIQ_API_KEY for free address autocomplete. Set GOOGLE_PLACES_API_KEY as fallback.
 */
import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {
  GOOGLE_PLACES_API_KEY,
  LOCATIONIQ_API_KEY,
  useAddressAutocomplete,
} from '../config';
import {colors} from '../theme/colors';
import {FormInput} from './FormInput';

export interface AddressResult {
  address: string;
  suite?: string;
  city: string;
  state: string;
  zipCode: string;
}

interface AddressAutocompleteInputProps {
  label: string;
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  /** When using with form that has city/state/zip, pass this to auto-fill those fields */
  onAddressSelect?: (result: AddressResult) => void;
}

interface LocationIqResult {
  display_name: string;
  display_place?: string;
  display_address?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    state_code?: string;
    postcode?: string;
    country?: string;
  };
}

function parseLocationIqToResult(item: LocationIqResult): AddressResult {
  const addr = item.address ?? {};
  const street = [addr.house_number, addr.road].filter(Boolean).join(' ').trim();
  const a = addr as {suite?: string; unit?: string};
  const suite = a.suite ?? a.unit ?? undefined;
  return {
    address: street || item.display_address || item.display_name,
    suite: suite || undefined,
    city: addr.city ?? '',
    state: addr.state_code ?? addr.state ?? '',
    zipCode: addr.postcode ?? '',
  };
}

function AddressAutocompleteGoogle({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  label,
}: AddressAutocompleteInputProps) {
  const ref = useRef<GooglePlacesAutocomplete>(null);

  const handlePress = (data: {description: string}, details: {address_components?: Array<{long_name: string; short_name: string; types: string[]}>} | null) => {
    const addr = details?.address_components;
    if (!addr) {
      onChange(data.description);
      return;
    }
    const get = (type: string) =>
      addr.find((c: {types: string[]}) => c.types.includes(type))?.long_name ?? '';
    const getShort = (type: string) =>
      addr.find((c: {types: string[]}) => c.types.includes(type))?.short_name ?? '';
    const street = (get('street_number') + ' ' + get('route')).trim();
    const suite = get('subpremise') || undefined;
    const result: AddressResult = {
      address: street || data.description,
      suite: suite || undefined,
      city: get('locality') || get('sublocality') || get('administrative_area_level_2'),
      state: getShort('administrative_area_level_1'),
      zipCode: get('postal_code'),
    };
    onChange(result.address);
    onAddressSelect?.(result);
    ref.current?.setAddressText(result.address);
  };

  return (
    <View style={[styles.container, styles.containerRaised]}>
      <Text style={styles.label}>{label}</Text>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder ?? 'Search address...'}
        minLength={2}
        fetchDetails
        onPress={handlePress}
        onFail={e => {
          if (__DEV__) {
            console.warn('[AddressAutocomplete] Google Places:', e);
          }
        }}
        query={{
          key: GOOGLE_PLACES_API_KEY,
          language: 'en',
          types: 'address',
          components: 'country:us',
        }}
        textInputProps={{
          value,
          onChangeText: onChange,
          style: styles.input,
          placeholderTextColor: colors.gray,
        }}
        styles={{
          container: styles.googleContainer,
          textInputContainer: styles.textInputContainer,
          textInput: styles.input,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          poweredContainer: styles.poweredContainer,
        }}
        enablePoweredByContainer={false}
      />
    </View>
  );
}

function AddressAutocompleteLocationIQ({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  label,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<LocationIqResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    const trimmed = q.trim();
    // Append ", Texas" to bias search toward TX addresses (avoids CO, MO, etc.)
    const searchQuery = trimmed.toLowerCase().includes('texas') || trimmed.toLowerCase().includes(', tx')
      ? trimmed
      : `${trimmed}, Texas`;
    const encoded = encodeURIComponent(searchQuery);
    const baseParams = `key=${LOCATIONIQ_API_KEY}&countrycodes=us&limit=20&normalizecity=1&statecode=1&dedupe=1`;
    const texasViewbox = '&viewbox=-106.65,25.84,-93.51,36.5&bounded=1'; // bounded=1: Texas only
    setLoading(true);
    try {
      let res = await fetch(
        `https://api.locationiq.com/v1/autocomplete?${baseParams}&q=${encoded}${texasViewbox}`,
      );
      let data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        if (!data?.error) {
          res = await fetch(
            `https://api.locationiq.com/v1/search?${baseParams}&q=${encoded}&format=json&addressdetails=1${texasViewbox}`,
          );
          data = await res.json();
        }
      }
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
        setShowList(true);
      } else if (data?.error) {
        setSuggestions([]);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 500);
  };

  const handleSelect = (item: LocationIqResult) => {
    const result = parseLocationIqToResult(item);
    onChange(result.address);
    onAddressSelect?.(result);
    setSuggestions([]);
    setShowList(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, showList && styles.containerRaised]} collapsable={false}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => suggestions.length > 0 && setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        placeholder={placeholder ?? 'Search address...'}
        placeholderTextColor={colors.gray}
      />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}
      {showList && suggestions.length > 0 && (
        <View style={styles.listView}>
          {/* ScrollView + map avoids VirtualizedList inside parent ScrollView (RN warning / broken taps) */}
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator>
            {suggestions.map((item, i) => (
              <TouchableOpacity
                key={item.display_name + String(i)}
                style={styles.row}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}>
                <Text style={styles.description} numberOfLines={3}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function AddressAutocompleteInput(props: AddressAutocompleteInputProps) {
  if (!useAddressAutocomplete) {
    return (
      <FormInput
        label={props.label}
        placeholder={props.placeholder ?? 'Enter address'}
        value={props.value}
        onChangeText={v => props.onChange(v)}
      />
    );
  }

  // Google Places is primary. LocationIQ is fallback when Google key not set.
  if (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY.length > 10) {
    return <AddressAutocompleteGoogle {...props} />;
  }

  if (LOCATIONIQ_API_KEY && LOCATIONIQ_API_KEY.length > 10) {
    return <AddressAutocompleteLocationIQ {...props} />;
  }

  return (
    <FormInput
      label={props.label}
      placeholder={props.placeholder ?? 'Enter address'}
      value={props.value}
      onChangeText={v => props.onChange(v)}
    />
  );
}

const styles = StyleSheet.create({
  // No flex:1 here: inside screen ScrollView it collapses height and clips children.
  container: {
    marginBottom: 16,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  containerRaised: {
    zIndex: 1000,
    elevation: 1000,
  },
  label: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.darkGray,
    backgroundColor: colors.white,
  },
  googleContainer: {
    alignSelf: 'stretch',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  // In-flow list: absolute + ScrollView parent clips/hides suggestions on iPad.
  listView: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
  },
  poweredContainer: {
    display: 'none',
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 38,
  },
});
