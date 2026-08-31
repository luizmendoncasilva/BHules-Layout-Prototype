import * as React from "react";
export type PortalContainer = HTMLElement | (() => HTMLElement | null | undefined);
export type FixedPortalPanelOptions = {
    portalContainer?: PortalContainer;
    zIndex?: number;
};
export type PanelCoords = {
    top: number;
    left: number;
};
export declare const DEFAULT_PORTAL_Z_INDEX = 9999;
export declare function resolvePortalContainer(container?: PortalContainer): HTMLElement;
export declare function getPanelCoords(anchor: HTMLElement): PanelCoords;
export declare function useFixedPortalPanel<TPanel extends HTMLElement = HTMLDivElement>({ portalContainer, zIndex, }?: FixedPortalPanelOptions): {
    open: boolean;
    coords: PanelCoords | null;
    anchorRef: React.RefObject<HTMLDivElement | null>;
    panelRef: React.RefObject<TPanel | null>;
    panelId: string;
    zIndex: number;
    closePanel: () => void;
    openPanel: () => void;
    togglePanel: () => void;
    getPortalContainer: () => HTMLElement;
};
