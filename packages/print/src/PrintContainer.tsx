/**
 * A React component to view a PDF document
 *
 * @see https://react-pdf-viewer.dev
 * @license https://react-pdf-viewer.dev/license
 * @copyright 2019-2022 Nguyen Huu Phuoc <me@phuoc.ng>
 */

import type { PdfJs, Store, StoreHandler } from '@react-pdf-viewer/core';
import * as React from 'react';
import { CheckPrintPermission } from './CheckPrintPermission';
import { PrintProgress } from './PrintProgress';
import { PrintZone } from './PrintZone';
import { PrintStatus } from './structs/PrintStatus';
import type { StoreProps } from './types/StoreProps';

export const PrintContainer: React.FC<{
    doc: PdfJs.PdfDocument;
    pagesRotation: Map<number, number>;
    pageHeight: number;
    pageWidth: number;
    renderProgressBar?(numLoadedPages: number, numPages: number, onCancel: () => void): React.ReactElement;
    rotation: number;
    setPages: (doc: PdfJs.PdfDocument) => number[];
    store: Store<StoreProps>;
}> = ({ doc, pagesRotation, pageHeight, pageWidth, renderProgressBar, rotation, setPages, store }) => {
    const [printStatus, setPrintStatus] = React.useState(PrintStatus.Inactive);
    const [numLoadedPagesForPrint, setNumLoadedPagesForPrint] = React.useState(0);
    const printPages = React.useMemo(() => {
        const { numPages } = doc;
        // To make sure the print pages are valid
        return setPages(doc).filter((index) => index >= 0 && index < numPages);
    }, [doc]);
    const numPrintPages = printPages.length;

    const cancelPrinting = (): void => {
        setNumLoadedPagesForPrint(0);
        setPrintStatus(PrintStatus.Inactive);
    };

    const handlePrintStatus: StoreHandler<PrintStatus> = (status: PrintStatus) => setPrintStatus(status);

    const onLoadPage = () => {
        const total = numLoadedPagesForPrint + 1;
        if (total <= numPrintPages) {
            setNumLoadedPagesForPrint(total);
            total === numPrintPages && setPrintStatus(PrintStatus.Ready);
        }
    };

    React.useEffect(() => {
        store.subscribe('printStatus', handlePrintStatus);
        return () => {
            store.unsubscribe('printStatus', handlePrintStatus);
        };
    }, []);

    return (
        <>
            {printStatus === PrintStatus.CheckingPermission && <CheckPrintPermission doc={doc} store={store} />}
            {printStatus === PrintStatus.Preparing &&
                (renderProgressBar ? (
                    renderProgressBar(numLoadedPagesForPrint, numPrintPages, cancelPrinting)
                ) : (
                    <PrintProgress
                        numLoadedPages={numLoadedPagesForPrint}
                        numPages={numPrintPages}
                        onCancel={cancelPrinting}
                    />
                ))}
            {(printStatus === PrintStatus.Preparing || printStatus === PrintStatus.Ready) &&
                numLoadedPagesForPrint <= numPrintPages && (
                    <PrintZone
                        doc={doc}
                        numLoadedPages={numLoadedPagesForPrint}
                        pagesRotation={pagesRotation}
                        pageHeight={pageHeight}
                        pageWidth={pageWidth}
                        printPages={printPages}
                        printStatus={printStatus}
                        rotation={rotation}
                        onCancel={cancelPrinting}
                        onLoad={onLoadPage}
                    />
                )}
        </>
    );
};
