export interface GatewayHop {
    gatewayType: string;
    gatewayId: string;
}

export const firstGatewayHop = (gatewayChain?: GatewayHop[]): GatewayHop => {
    return gatewayChain?.[0] || {gatewayType: '', gatewayId: ''};
};
