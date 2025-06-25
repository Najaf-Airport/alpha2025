// NajafFlightsApp/js/docx-export.js

// Import docx components (assumes docx library is loaded globally via CDN)
const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, Packer, AlignmentType, BorderStyle, HeadingLevel } = docx;

/**
 * Creates a DOCX document for a single flight.
 * @param {Object} flightData - The flight object.
 */
export async function exportSingleFlightToDocx(flightData) {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "تقرير رحلة",
                            bold: true,
                            size: 36, // ~18pt
                            color: "2C3E50", // Dark Blue from CSS
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `المستخدم: ${flightData.userName || 'غير معروف'}`,
                            bold: true,
                            size: 24, // ~12pt
                        }),
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 100 },
                }),
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ text: "التاريخ:", alignment: AlignmentType.RIGHT })],
                                    width: { size: 2000, type: WidthType.DXA },
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                        left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                        right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                    }
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: flightData.date || 'N/A', alignment: AlignmentType.RIGHT })],
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                        left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                        right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                    }
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ text: "رقم الرحلة (FLT.NO):", alignment: AlignmentType.RIGHT })],
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: flightData.fltNo || 'N/A', alignment: AlignmentType.RIGHT })],
                                }),
                            ],
                        }),
                        // Add more rows for each time field
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "ON chocks Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.onChocksTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Open Door Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.openDoorTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Start Cleaning Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.startCleaningTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Complete Cleaning Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.completeCleaningTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Ready Boarding Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.readyBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Start Boarding Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.startBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Complete Boarding Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.completeBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Close Door Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.closeDoorTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Off chocks Time:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.offChocksTime || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "الملاحظات:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ text: flightData.notes || 'N/A', alignment: AlignmentType.RIGHT })] }),
                            ],
                        }),
                    ],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" }, // Light grey inner borders
                        insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                    }
                }),
                new Paragraph({
                    text: "",
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "تولدت بواسطة نظام إدارة الطائرات في مطار النجف الأشرف الدولي.",
                            size: 20, // ~10pt
                            color: "777777",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
            ],
        }],
    });

    // Generate the DOCX blob
    const blob = await Packer.toBlob(doc);

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_رحلة_${flightData.fltNo}_${flightData.date}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Creates a DOCX document for admin statistics or all detailed flights.
 * @param {string} type - 'stats' or 'allFlights'.
 * @param {Object} data - Contains filtered flights, user counts, etc.
 * @param {string} filterMonth - Month in YYYY-MM format.
 * @param {string} filterUserEmail - User email or 'all'.
 */
export async function exportAdminDataToDocx(type, data, filterMonth, filterUserEmail) {
    const [year, month] = filterMonth.split('-');
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "أيلول", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthName = monthNames[parseInt(month) - 1];

    let sections = [];
    let fileName = "";

    if (type === 'stats') {
        const { userFlightCounts, totalFlights, allUsersMap } = data;
        fileName = `إحصائيات_رحلات_${monthName}_${year}.docx`;

        sections.push({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `إحصائيات الرحلات الشهرية لشهر ${monthName} لسنة ${year}`,
                            bold: true,
                            size: 36,
                            color: "2C3E50",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `العدد الكلي للرحلات: ${totalFlights}`,
                            bold: true,
                            size: 28,
                        }),
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "إحصائيات المستخدمين:",
                            bold: true,
                            size: 26,
                        }),
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 100 },
                }),
            ]
        });

        const userStatRows = Object.keys(userFlightCounts).sort((a, b) => {
            const nameA = allUsersMap.get(a) || '';
            const nameB = allUsersMap.get(b) || '';
            return nameA.localeCompare(nameB);
        }).map(userEmail => {
            if (userEmail === "ahmedaltalqani@gmail.com") return null; // Skip admin
            const userName = allUsersMap.get(userEmail) || userEmail;
            const count = userFlightCounts[userEmail];
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: userName, alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: count.toString(), alignment: AlignmentType.CENTER })] }),
                ]
            });
        }).filter(row => row !== null); // Filter out nulls (admin row)

        if (userStatRows.length > 0) {
             sections.push({
                children: [
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "اسم المستخدم", alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [new Paragraph({ text: "عدد الرحلات", alignment: AlignmentType.CENTER })] }),
                                ],
                                tableHeader: true,
                            }),
                            ...userStatRows
                        ],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                        }
                    })
                ]
            });
        }
    } else if (type === 'allFlights') {
        const { flightsToExport, usersStored } = data;
        const userDisplayName = filterUserEmail === 'all' ? 'الكل' : usersStored[filterUserEmail]?.name || filterUserEmail;
        fileName = `رحلات_تفصيلية_${userDisplayName}_${monthName}_${year}.docx`;

        sections.push({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `تقرير الرحلات التفصيلي لشهر ${monthName} لسنة ${year} - ${userDisplayName}`,
                            bold: true,
                            size: 36,
                            color: "2C3E50",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
            ]
        });

        if (flightsToExport.length === 0) {
            sections.push({
                children: [
                    new Paragraph({
                        text: "لا توجد رحلات لتصديرها بالفلاتر المحددة.",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        run: { color: "777777" }
                    })
                ]
            });
        } else {
            flightsToExport.forEach((flight, index) => {
                sections.push({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `--- الرحلة رقم ${index + 1} (${flight.userName || 'غير معروف'}) ---`,
                                    bold: true,
                                    size: 28,
                                    color: "34495e", // From CSS flight card h4
                                }),
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 300, after: 100 },
                        }),
                        new Table({
                            rows: [
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "التاريخ:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.date || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "رقم الرحلة (FLT.NO):", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.fltNo || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "ON chocks Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.onChocksTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Open Door Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.openDoorTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Start Cleaning Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.startCleaningTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Complete Cleaning Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.completeCleaningTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Ready Boarding Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.readyBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Start Boarding Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.startBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Complete Boarding Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.completeBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Close Door Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.closeDoorTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Off chocks Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.offChocksTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "الملاحظات:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.notes || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                            ],
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                                insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                            }
                        })
                    ]
                });
            });
        }
    }

    const doc = new Document({
        sections: sections,
    });

    // Generate the DOCX blob
    const blob = await Packer.toBlob(doc);

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
