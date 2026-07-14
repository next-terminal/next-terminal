import React from 'react';
import {useLicense} from "@/hook/LicenseContext";
import GatewayChainEditor from "@/pages/assets/components/GatewayChainEditor";

const GatewayView: React.FC = () => {
    const {license, isLoading: licenseLoading} = useLicense();
    const hasPremiumFeatures = !licenseLoading && license.hasPremiumFeatures();

    return <GatewayChainEditor disabled={!hasPremiumFeatures}/>;
};

export default GatewayView;
