export interface TemplateCatalogEntry {
    title: string;
    description: string;
    thumbnail: string;
    device?: string;
    manufactur?: string;
    useCase: string;
    dashboard: string;
    comingSoon: boolean;
}

export interface AppTemplateDetails {
    title: string;
    tagLine: string;
    description: string;
    media: any;
    plugins: any;
    microservice: any;
    dashboards: any;
    
}

export interface TemplateDetails {
    input: {
        devices?: Array<DeviceDescription>;
        images?: Array<BinaryDescription>;
        dependencies?: Array<DependencyDescription>;
        binaries?: Array<BinaryDescription>;
    },
    description: string;
    preview: string;
    widgets: Array<TemplateDashboardWidget>;
}

export interface DeviceDescription {
    type: string;
    placeholder: string;
    reprensentation?: {
        id: string;
        name: string;
    };
}

export interface BinaryDescription {
    type: string;
    placeholder: string;
    id?: string;
    link?: string;
}

export interface TemplateDashboardWidget {
    id?: string;
    name: string;
    _x: number;
    _y: number;
    _height: number;
    _width: number;
    config: object;
    position?: number;
    title?: string;
    templateUrl?: string;
    configTemplateUrl?: string;
}

export interface DependencyDescription {
    id: string;
    title: string;
    repository: string;
    link: string;
    isInstalled?: boolean;
    fileName?: string;
    requiredPlatformVersion?: string;
    isSupported?: boolean;
    visible?: boolean;
    contextPath?: string;
}