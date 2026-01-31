-- ============================================
-- THAI AIRWAYS DESTINATIONS
-- ============================================

INSERT INTO airports (icao, iata, name, location) VALUES
    -- Europe
    ('EBBR', 'BRU', 'Brussels Airport', ST_SetSRID(ST_MakePoint(4.4539, 50.9014), 4326)::GEOGRAPHY),
    ('EDDF', 'FRA', 'Frankfurt Airport', ST_SetSRID(ST_MakePoint(8.5704, 50.0379), 4326)::GEOGRAPHY),
    ('EDDM', 'MUC', 'Munich Airport', ST_SetSRID(ST_MakePoint(11.7861, 48.3537), 4326)::GEOGRAPHY),
    ('EGLL', 'LHR', 'Heathrow Airport', ST_SetSRID(ST_MakePoint(-0.4614, 51.4700), 4326)::GEOGRAPHY),
    ('EKCH', 'CPH', 'Copenhagen Airport', ST_SetSRID(ST_MakePoint(12.6508, 55.6180), 4326)::GEOGRAPHY),
    ('ENGM', 'OSL', 'Oslo Airport', ST_SetSRID(ST_MakePoint(11.1004, 60.1976), 4326)::GEOGRAPHY),
    ('ESSA', 'ARN', 'Stockholm Arlanda Airport', ST_SetSRID(ST_MakePoint(17.9186, 59.6519), 4326)::GEOGRAPHY),
    ('LFPG', 'CDG', 'Charles de Gaulle Airport', ST_SetSRID(ST_MakePoint(2.5539, 49.0097), 4326)::GEOGRAPHY),
    ('LIMC', 'MXP', 'Malpensa Airport', ST_SetSRID(ST_MakePoint(8.7266, 45.6306), 4326)::GEOGRAPHY),
    ('LSZH', 'ZRH', 'Zurich Airport', ST_SetSRID(ST_MakePoint(8.5636, 47.4582), 4326)::GEOGRAPHY),
    ('LTFM', 'IST', 'Istanbul Airport', ST_SetSRID(ST_MakePoint(28.7519, 41.2753), 4326)::GEOGRAPHY),

    -- Middle East & South Asia
    ('OEJN', 'JED', 'King Abdulaziz Int''l Airport', ST_SetSRID(ST_MakePoint(39.1564, 21.6796), 4326)::GEOGRAPHY),
    ('OPIS', 'ISB', 'Islamabad Int''l Airport', ST_SetSRID(ST_MakePoint(72.8526, 33.5605), 4326)::GEOGRAPHY),
    ('OPKC', 'KHI', 'Jinnah Int''l Airport', ST_SetSRID(ST_MakePoint(67.1601, 24.9065), 4326)::GEOGRAPHY),
    ('OPLA', 'LHE', 'Allama Iqbal Int''l Airport', ST_SetSRID(ST_MakePoint(74.3977, 31.5216), 4326)::GEOGRAPHY),

    -- East Asia
    ('RCKH', 'KHH', 'Kaohsiung Int''l Airport', ST_SetSRID(ST_MakePoint(120.3509, 22.5771), 4326)::GEOGRAPHY),
    ('RCTP', 'TPE', 'Taoyuan Int''l Airport', ST_SetSRID(ST_MakePoint(121.2329, 25.0777), 4326)::GEOGRAPHY),
    ('RJAA', 'NRT', 'Narita Int''l Airport', ST_SetSRID(ST_MakePoint(140.3855, 35.7647), 4326)::GEOGRAPHY),
    ('RJBB', 'KIX', 'Kansai Int''l Airport', ST_SetSRID(ST_MakePoint(135.4354, 34.4347), 4326)::GEOGRAPHY),
    ('RJCC', 'CTS', 'New Chitose Airport', ST_SetSRID(ST_MakePoint(141.6919, 42.7752), 4326)::GEOGRAPHY),
    ('RJFF', 'FUK', 'Fukuoka Airport', ST_SetSRID(ST_MakePoint(130.4536, 33.5859), 4326)::GEOGRAPHY),
    ('RJGG', 'NGO', 'Chubu Centrair Int''l Airport', ST_SetSRID(ST_MakePoint(136.8103, 34.8584), 4326)::GEOGRAPHY),
    ('RJTT', 'HND', 'Haneda Airport', ST_SetSRID(ST_MakePoint(139.7797, 35.5494), 4326)::GEOGRAPHY),
    ('RKSI', 'ICN', 'Incheon Int''l Airport', ST_SetSRID(ST_MakePoint(126.4587, 37.4602), 4326)::GEOGRAPHY),

    -- Southeast Asia
    ('RPLL', 'MNL', 'Ninoy Aquino Int''l Airport', ST_SetSRID(ST_MakePoint(121.0174, 14.5086), 4326)::GEOGRAPHY),
    ('VAAH', 'AMD', 'Sardar Vallabhbhai Patel Int''l Airport', ST_SetSRID(ST_MakePoint(72.6358, 23.0772), 4326)::GEOGRAPHY),
    ('VABB', 'BOM', 'Chhatrapati Shivaji Maharaj Int''l Airport', ST_SetSRID(ST_MakePoint(72.8674, 19.0896), 4326)::GEOGRAPHY),
    ('VCBI', 'CMB', 'Bandaranaike Int''l Airport', ST_SetSRID(ST_MakePoint(79.8854, 7.1808), 4326)::GEOGRAPHY),
    ('VDPP', 'PNH', 'Phnom Penh Int''l Airport', ST_SetSRID(ST_MakePoint(104.8449, 11.5466), 4326)::GEOGRAPHY),
    ('VDSA', 'REP', 'Siem Reap–Angkor Int''l Airport', ST_SetSRID(ST_MakePoint(103.9873, 13.4107), 4326)::GEOGRAPHY),
    ('VECC', 'CCU', 'Netaji Subhas Chandra Bose Int''l Airport', ST_SetSRID(ST_MakePoint(88.4477, 22.6547), 4326)::GEOGRAPHY),
    ('VEGY', 'GAY', 'Gaya Airport', ST_SetSRID(ST_MakePoint(85.0943, 24.6134), 4326)::GEOGRAPHY),
    ('VGHS', 'DAC', 'Hazrat Shahjalal Int''l Airport', ST_SetSRID(ST_MakePoint(90.3978, 23.8433), 4326)::GEOGRAPHY),
    ('VHHH', 'HKG', 'Hong Kong Int''l Airport', ST_SetSRID(ST_MakePoint(113.9185, 22.3080), 4326)::GEOGRAPHY),
    ('VIDP', 'DEL', 'Indira Gandhi Int''l Airport', ST_SetSRID(ST_MakePoint(77.1030, 28.5562), 4326)::GEOGRAPHY),
    ('VLVT', 'VTE', 'Wattay Int''l Airport', ST_SetSRID(ST_MakePoint(102.5633, 17.9883), 4326)::GEOGRAPHY),
    ('VNKT', 'KTM', 'Tribhuvan Int''l Airport', ST_SetSRID(ST_MakePoint(77.6929, 27.6966), 4326)::GEOGRAPHY),
    ('VOBL', 'BLR', 'Kempegowda Int''l Airport', ST_SetSRID(ST_MakePoint(77.7064, 13.1986), 4326)::GEOGRAPHY),
    ('VOCI', 'COK', 'Cochin Int''l Airport', ST_SetSRID(ST_MakePoint(76.4019, 10.1520), 4326)::GEOGRAPHY),
    ('VOHS', 'HYD', 'Rajiv Gandhi Int''l Airport', ST_SetSRID(ST_MakePoint(78.4299, 17.2403), 4326)::GEOGRAPHY),
    ('VOMM', 'MAA', 'Chennai Int''l Airport', ST_SetSRID(ST_MakePoint(80.1700, 12.9941), 4326)::GEOGRAPHY),

    -- Thailand
    ('VTBS', 'BKK', 'Suvarnabhumi Airport', ST_SetSRID(ST_MakePoint(100.7501, 13.6900), 4326)::GEOGRAPHY),
    ('VTCC', 'CNX', 'Chiang Mai Int''l Airport', ST_SetSRID(ST_MakePoint(98.9629, 18.7668), 4326)::GEOGRAPHY),
    ('VTCT', 'CEI', 'Mae Fah Luang - Chiang Rai Int''l Airport', ST_SetSRID(ST_MakePoint(99.8827, 19.9613), 4326)::GEOGRAPHY),
    ('VTSG', 'KBV', 'Krabi Airport', ST_SetSRID(ST_MakePoint(98.7951, 8.1019), 4326)::GEOGRAPHY),
    ('VTSP', 'HKT', 'Phuket Int''l Airport', ST_SetSRID(ST_MakePoint(98.3169, 8.1132), 4326)::GEOGRAPHY),
    ('VTSS', 'HDY', 'Hat Yai Airport', ST_SetSRID(ST_MakePoint(100.4364, 6.9192), 4326)::GEOGRAPHY),
    ('VTUD', 'UTH', 'Udon Thani Int''l Airport', ST_SetSRID(ST_MakePoint(102.7947, 17.3951), 4326)::GEOGRAPHY),
    ('VTUK', 'KKC', 'Khon Kaen Airport', ST_SetSRID(ST_MakePoint(102.7811, 16.4672), 4326)::GEOGRAPHY),
    ('VTUU', 'UBP', 'Ubon Ratchathani Airport', ST_SetSRID(ST_MakePoint(105.1767, 15.2380), 4326)::GEOGRAPHY),

    -- Vietnam & Myanmar
    ('VVNB', 'HAN', 'Noi Bai Int''l Airport', ST_SetSRID(ST_MakePoint(105.8072, 21.2212), 4326)::GEOGRAPHY),
    ('VVTS', 'SGN', 'Tan Son Nhat Int''l Airport', ST_SetSRID(ST_MakePoint(106.6520, 10.8188), 4326)::GEOGRAPHY),
    ('VYYY', 'RGN', 'Yangon Int''l Airport', ST_SetSRID(ST_MakePoint(96.1332, 16.9073), 4326)::GEOGRAPHY),

    -- Indonesia & Malaysia
    ('WADD', 'DPS', 'Ngurah Rai Int''l Airport', ST_SetSRID(ST_MakePoint(115.1671, -8.7467), 4326)::GEOGRAPHY),
    ('WIII', 'CGK', 'Soekarno-Hatta Int''l Airport', ST_SetSRID(ST_MakePoint(106.6567, -6.1256), 4326)::GEOGRAPHY),
    ('WMKK', 'KUL', 'Kuala Lumpur Int''l Airport', ST_SetSRID(ST_MakePoint(101.7011, 2.7456), 4326)::GEOGRAPHY),
    ('WMKP', 'PEN', 'Penang Int''l Airport', ST_SetSRID(ST_MakePoint(100.2975, 5.2972), 4326)::GEOGRAPHY),
    ('WSSS', 'SIN', 'Changi Airport', ST_SetSRID(ST_MakePoint(103.9878, 1.3644), 4326)::GEOGRAPHY),

    -- Australia
    ('YMML', 'MEL', 'Melbourne Airport', ST_SetSRID(ST_MakePoint(144.8410, -37.6690), 4326)::GEOGRAPHY),
    ('YPPH', 'PER', 'Perth Airport', ST_SetSRID(ST_MakePoint(115.9666, -31.9403), 4326)::GEOGRAPHY),
    ('YSSY', 'SYD', 'Kingsford Smith Airport', ST_SetSRID(ST_MakePoint(151.1794, -33.9399), 4326)::GEOGRAPHY),

    -- China
    ('ZBAA', 'PEK', 'Beijing Capital Int''l Airport', ST_SetSRID(ST_MakePoint(116.5846, 40.0801), 4326)::GEOGRAPHY),
    ('ZGGG', 'CAN', 'Guangzhou Baiyun Int''l Airport', ST_SetSRID(ST_MakePoint(113.2989, 23.3924), 4326)::GEOGRAPHY),
    ('ZPPP', 'KMG', 'Kunming Changshui Int''l Airport', ST_SetSRID(ST_MakePoint(102.9290, 25.1019), 4326)::GEOGRAPHY),
    ('ZSPD', 'PVG', 'Shanghai Pudong Int''l Airport', ST_SetSRID(ST_MakePoint(121.8054, 31.1443), 4326)::GEOGRAPHY),
    ('ZUTF', 'TFU', 'Chengdu Tianfu Int''l Airport', ST_SetSRID(ST_MakePoint(104.4407, 30.3085), 4326)::GEOGRAPHY)
ON CONFLICT (icao) DO NOTHING;
