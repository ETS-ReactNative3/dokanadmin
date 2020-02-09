import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import GLOBAL from './productglobal'
import Base64 from '../../utility/base64';

const config = require('../../../config.json');

export default class ProductDetails extends Component {

    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.getParam('productName', 'Product'),
        };
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            productData: {}
        };
        productId = this.props.navigation.getParam('productId');
        base_url = this.props.navigation.getParam('base_url');
        c_key = this.props.navigation.getParam('c_key');
        c_secret = this.props.navigation.getParam('c_secret');
        GLOBAL.productdetailsScreen = this;
        this._isMounted = false;
    }

    async componentDidMount() {
        this._isMounted = true;
        this._isMounted && await this.getCredentials();
        this.focusListener = this.props.navigation.addListener('didFocus', () => {
            this.fetchProductDetails()
        });
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    getCredentials = async () => {
        const credentials = await SecureStore.getItemAsync('credentials');
        const credentialsJson = JSON.parse(credentials)
        this.setState({
            base_url: credentialsJson.base_url,
            username: credentialsJson.username,
            password: credentialsJson.password,
        })
    }

    fetchProductDetails = () => {
        const { base_url, username, password} = this.state;
        const url = `${base_url}/wp-json/dokan/v1/products/${productId}`;
        let headers = {
            'Authorization': `Basic ${Base64.btoa(username + ':' + password)}`
        }
        this.setState({ loading: true });
        fetch(url, {
            method: 'GET',
            headers: headers
        }).then((response) => response.json())
            .then((responseJson) => {
                this.setState({
                    productData: responseJson,
                    error: responseJson.code || null,
                    loading: false
                });
            }).catch((error) => {
                this.setState({
                    error,
                    loading: false
                })
            });
    }

    //Get Product Images
    getProductImages() {
        if ('images' in this.state.productData) {
            let productImagesData = [];
            this.state.productData.images.forEach(item => {
                if ('src' in item) {
                    productImagesData.push(
                        <Image
                            key={`image_${item.id}`}
                            source={{ uri: item.src }}
                            style={{ width: 150, height: 150 }}
                            resizeMode='contain'
                        />
                    )
                }
            });
            return <ScrollView horizontal={true}>{productImagesData}</ScrollView>
        }
        return <></>
    }

    //Get product categories data
    getProductCategories() {
        if ('categories' in this.state.productData) {
            let productCategoriesData = [];
            this.state.productData.categories.forEach(item => {
                productCategoriesData.push(
                    <View key={`category_${item.id}`} style={{
                        flexDirection: "row",
                        padding: 5,
                        margin: 5,
                        backgroundColor: 'white',
                        borderColor: 'black',
                        borderWidth: 0.25,
                        borderRadius: 10
                    }}>
                        <Text>{item.name ? item.name : null}</Text>
                    </View>
                )
            })
            return productCategoriesData;
        }
        return <></>
    }

    //Get product attributes data
    getProductAttributes() {
        if ('attributes' in this.state.productData) {
            let productAttributesData = [];
            this.state.productData.attributes.forEach(item => {
                let attributesOptions = [];
                item.options.forEach((option, index) =>
                    attributesOptions.push(
                        <View key={`attribute_${item.id}_option${index}`} style={{
                            flexDirection: "row",
                            margin: 5,
                            padding: 5,
                            backgroundColor: 'white',
                            borderColor: 'black',
                            borderWidth: 0.25,
                            borderRadius: 10
                        }}>
                            <Text>{option}</Text>
                        </View>
                    )
                )
                productAttributesData.push(
                    <View key={`attribute_${item.id}`} style={{ marginTop: 10 }}>
                        <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
                        <ScrollView horizontal={true}>
                            {attributesOptions}
                        </ScrollView>
                    </View>
                )
            }
            )
            return productAttributesData;
        }
        return <></>
    }

    render() {
        if (this.state.loading) {
            return (
                <View style={{ flex: 1, justifyContent: "center", alignContent: "center", padding: 20 }}>
                    <ActivityIndicator color={config.colors.loadingColor} size='large' />
                </View>
            )
        }

        return (
            <View style={{ flex: 1 }}>
                {this.state.loading ? <ActivityIndicator size='large' color={config.colors.loadingColor} /> :
                    <View style={{ flex: 1 }}>
                        <ScrollView style={{ flex: 1 }}>
                            {this.displayProductImages()}
                            {this.displayProductBasicDetails()}
                            {this.displayProductPricingDetails()}
                            {this.displayProductInventoryDetails()}
                            {this.displayProductShippingDetails()}
                            {this.displayProductCategoriesDetails()}
                            {this.displayProductAttributesDetails()}
                        </ScrollView>
                        {this.displayEditProductButton()}
                    </View>
                }
            </View>
        );
    }

    //Display Functions Below

    displayProductImages = () => {
        return (
            <View style={{ height: 150 }}>
                {this.getProductImages()}
            </View>
        )
    }

    displayProductBasicDetails = () => {
        return (
            <View style={styles.section}>
                <Text style={styles.titleText}>{this.state.productData.name}</Text>
                <Text>Sku: {this.state.productData.sku}</Text>
                <Text>Slug: {this.state.productData.slug}</Text>
                <Text>Status: {this.state.productData.status}</Text>
                <Text>Total Ordered: {this.state.productData.total_sales}</Text>
            </View>
        )
    }

    displayProductPricingDetails = () => {
        return (
            <View style={styles.section}>
                <Text style={styles.titleText}>Pricing</Text>
                <Text>Regular Price: {this.state.productData.regular_price}</Text>
                <Text>Sale Price: {this.state.productData.sale_price}</Text>
            </View>
        )
    }

    displayProductInventoryDetails = () => {
        return (
            <View style={styles.section}>
                <Text style={styles.titleText}>Inventory</Text>
                <Text>Stock Status: {this.state.productData.stock_status}</Text>
                <Text>Manage Stock: {this.state.productData.manage_stock ? 'Yes' : 'No'}</Text>
                <Text>Stock Qty: {this.state.productData.stock_quantity}</Text>
            </View>
        )
    }

    displayProductShippingDetails = () => {
        return (
            <View style={styles.section}>
                <Text style={styles.titleText}>Shipping</Text>
                <Text>Weight: {this.state.productData.weight}</Text>
                <Text>Size: {('dimensions' in this.state.productData) ? this.state.productData.dimensions.length : null}
                    {('dimensions' in this.state.productData)
                        ? (this.state.productData.dimensions.length) ?
                            `x${this.state.productData.dimensions.width}`
                            : null
                        : null}
                    {('dimensions' in this.state.productData)
                        ? (this.state.productData.dimensions.length)
                            ? `x${this.state.productData.dimensions.height}`
                            : null
                        : null}
                </Text>
            </View>
        )
    }

    displayProductCategoriesDetails = () => {
        return (
            <View style={styles.section}>
                <Text style={styles.titleText}>Categories</Text>
                <ScrollView horizontal={true}>{this.getProductCategories()}</ScrollView>
            </View>
        )
    }

    displayProductAttributesDetails = () => {
        return (
            <View style={styles.section}>
                <Text style={styles.titleText}>Attributes</Text>
                <>{this.getProductAttributes()}</>
            </View>
        )
    }

    displayEditProductButton = () => {
        return (
            <TouchableOpacity
                style={{
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    position: 'absolute',
                    bottom: 15,
                    right: 15,
                    backgroundColor: '#fff',
                    borderRadius: 100,
                }}
                onPress={() => {
                    this.props.navigation.navigate('EditProduct', {
                        productId: productId,
                        productName: this.state.productData.name,
                        productData: this.state.productData,
                        base_url: this.state.base_url,
                        username: this.state.username,
                        password: this.state.password
                    });
                }}
            >
                <Ionicons name="md-create" size={30} color={config.colors.btnColor} />
            </TouchableOpacity>
        )
    }

}

const styles = StyleSheet.create({
    section: {
        marginTop: 15,
        marginLeft: 15,
        marginRight: 15
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
