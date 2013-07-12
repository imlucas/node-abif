"use strict";

var ABIF_TYPES = {
    1: 'byte',
    2: 'char',
    3: 'word',
    4: 'short',
    5: 'long',
    7: 'float',
    8: 'double',
    10: 'date',
    11: 'time',
    12: 'thumb',
    13: 'bool',
    18: 'pString',
    19: 'cString'
};

module.exports = function(buf){
    return new Reader(buf);
};

module.exports.Reader = Reader;

function Reader(buf){
    this.buf = buf;
    this.pos = 0;
    this.type = this.readNextString(4);
    this.version = this.readNextShort();

    var dir = new DirEntry(this);
    this.seek(dir.dataoffset);

    this.entries = [];
    for(var i =0; i<= dir.numelements -1; i++){
        var e = new DirEntry(this);
        this.entries.push(e);
    }
}
Reader.prototype.showEntries = function(){
    this.entries.map(function(entry){
        console.log(entry.name);
    });
};

Reader.prototype.getData = function(name, num){
    if(num === undefined){
        num = 1;
    }
    var entry = this.getEntry(name, num);
    if(!entry){
        // throw new Error('Entry ' + name + ' (' +num + ')  not found.');
        return undefined;
    }
    this.seek(entry.mydataoffset);
    data = this.readData(entry.elementtype, entry.numelements);
    return data.length === 1 ? data[0] : data;
};


Reader.prototype.getEntry = function(name, num){
    var entry;

    this.entries.some(function(e){
        if(e.name === name && e.number === num){
            entry = e;
            return true;
        }
    });
    return entry;
};

Reader.prototype.readData = function(type, num){
    var m = {
        1: 'Byte',
        3: 'UnsignedInt',
        4: 'Short',
        5: 'Long',
        7: 'Float',
        8: 'Double',
        10: 'Date',
        11: 'Time',
        12: 'Thumb',
        13: 'Bool'
    };

    if(m[type]){
        return this._loop(m[type], num);
    }
    else if(type === 2){
        return this.readNextString(num);
    }
    else if(type === 18){
        return this.readNextpString(num);
    }
    else if(type === 19){
        return this.readNextcString(num);
    }
    return this[m[type]](num);
};

Reader.prototype._loop = function(type, num){
    var buf = [],
        method = 'readNext' + type;

    for(var i=0; i < num; i++){
        buf.push(this[method]());
    }
    return buf;
};

Reader.prototype.readNextShort = function(){
    var v = this.buf.readInt16BE(this.pos);
    this.pos += 2;
    return v;
};
Reader.prototype.readNextInt = function(){
    var v = this.buf.readInt32BE(this.pos);
    this.pos += 4;
    return v;
};

Reader.prototype.readNextChar = function(){
    var v = this.buf.toString('ascii', this.pos, this.pos+1);
    this.pos += 1;
    return v;
};

Reader.prototype.readNextByte = function(){
    var v = this.buf.readUInt8(this.pos);
    this.pos += 1;
    return v;
};

Reader.prototype.readNextUnsignedInt = function(){
    var v = this.buf.readUInt32BE(this.pos);
    this.pos += 4;
    return v;
};

Reader.prototype.readNextLong = function(){
    var v = this.buf.readInt32BE(this.pos);
    this.pos += 4;
    return v;
};

Reader.prototype.readNextFloat = function(){
    var v = this.buf.readFloatBE(this.pos);
    this.pos += 4;
    return v;
};


Reader.prototype.readNextDouble = function(){
    var v = this.buf.readDoubleBE(this.pos);
    this.pos += 8;
    return v;
};

Reader.prototype.readNextBool = function(){
    return this.readNextByte() === 1;
};

Reader.prototype.readNextDate = function(){
    var d = new Date();
    var y = this.readNextShort();
    var m = this.readNextByte();
    var day = this.readNextByte();

    console.log(y. m, day);
    d.setYear(y);
    d.setMonth(m);
    d.setDate(day);
    return d;
};


Reader.prototype.readNextTime = function(){
    var d = new Date();
    d.setHours(this.readNextByte());
    d.setMinutes(this.readNextByte());
    d.setSeconds(this.readNextByte());
    d.setMilliseconds(this.readNextByte());
    return d;
};

Reader.prototype.readNextThumb = function(){
    return [
        this.readNextLong(),
        this.readNextLong(),
        this.readNextByte(),
        this.readNextByte()
    ];
};

Reader.prototype.readNextString = function(size){
    var chars = [];
    for(var i = 0; i <= size -1; i++){
        chars.push(this.readNextChar());
    }
    return chars.join('');
};

Reader.prototype.readNextpString = function(){
    return this.readNextString(this.readNextByte());
};

Reader.prototype.readNextcString = function(){
    var chars = [],
        c;
    while(true){
        c = this.readNextChar();
        if(c.charAt(0) === 0){
            return chars.join('');
        }
        else {
            chars.push(c);
        }
    }
};

Reader.prototype.tell = function(){
    return this.pos;
};

Reader.prototype.seek = function(pos){
    this.pos = pos;
};

function DirEntry(buf){
    this.name = buf.readNextString(4);
    this.number = buf.readNextInt();

    this.elementtype = buf.readNextShort();
    this.elementsize = buf.readNextShort();
    this.numelements = buf.readNextInt();
    this.datasize = buf.readNextInt();
    this.dataoffsetpos = buf.tell();
    this.dataoffset = buf.readNextInt();
    this.datahandle = buf.readNextInt();

    this.mydataoffset = (this.datasize <= 4) ? this.dataoffsetpos : this.dataoffset;
    this.mytype = (this.elementtype < 1024) ? ABIF_TYPES[this.elementtype] || 'unknown' : 'user';
}

// http://cpansearch.perl.org/src/VITA/Bio-Trace-ABIF-1.05/lib/Bio/Trace/ABIF.pm

Read.prototype.getAnalyzedDataForChannel = function(channel){
    if(channel === 5){
        channel = 205;
    }
    else {
        channel += 8;
    }
    if (channel < 9 || (channel > 12 && channel!= 205)) {
        return null;
    }
    return this.getEntry('DATA', channel);
};

Read.protoype.getBaseOrder = function(){
    return this.getData('FWO_').split('');
};

Read.prototype.getChannel = function(base){
    base = base.toUpperCase();
    var order = this.getBaseOrder();
    for(var i = 0; i <= order.length; i++){
        if(order[i] === base){
            return i + 1;
        }
    }
    return undefined;
};

Reader.prototype.getPeaks = function(){
    // sub peaks {
    //     my ($self, $n) = @_;
    //     my $k = '_PEAK' . $n;
    //     my ($position, $height, $beginPos, $endPos, $beginHI, $endHI, $area, $volume, $fragSize, $isEdited, $label);
    //     my $s = undef;
    //     my @raw_data;
    //     my @peak_array;
    //     my $i;

    //     unless (defined $self->{$k}) {
    //         @raw_data = $self->get_data_item('PEAK', $n, '(NnNNnnNNB32nZ64)*');
    //         for ($i = 0; $i < @raw_data; $i += 11) {
    //             ($position, $height, $beginPos, $endPos, $beginHI, $endHI, $area, $volume, $s, $isEdited, $label) = @raw_data[$i .. $i+10];
    //             $fragSize = $self->_ieee2decimal($s) if (defined $s);
    //             my $peak = {};
    //             $peak->{position} = $position;
    //             $peak->{height} = $height;
    //             $peak->{beginPos} = $beginPos;
    //             $peak->{endPos} = $endPos;
    //             $peak->{beginHI} = $beginHI;
    //             $peak->{endHI} = $endHI;
    //             $peak->{area} = $area;
    //             $peak->{volume} = $volume;
    //             $peak->{fragSize} = $fragSize;
    //             $peak->{isEdited} = $isEdited;
    //             $peak->{label} = $label;
    //             push @peak_array, $peak;
    //         }
    //     $self->{$k} = (@peak_array) ? [ @peak_array ] : [ ];
    //     }
    //     return @{$self->{$k}};
    // }
};

Reader.prototype.getRawDataForChannel = function(channel){
    // sub  raw_data_for_channel {
    //     my ($self, $channel_number) = @_;
    //     if ($channel_number == 5) {
    //         $channel_number = 105;
    //     }
    //     if ($channel_number < 1 or
    //         ($channel_number > 5 and $channel_number != 105)) {
    //         return ();
    //     }
    //     my $k = '_DATA' . $channel_number;
    //     unless (defined $self->{$k}) {
    //         my @data = map { ($_ < $SHORT_MID) ? $_ : $_ - $SHORT_MAX }
    //             $self->get_data_item('DATA', $channel_number, 'n*');
    //         $self->{$k} = (@data) ? [ @data ] : [ ];
    //     }

    //     return @{$self->{$k}};
    // }
};

Reader.prototype.getRawTrace = function(base){
    // sub raw_trace {
    //     my ($self, $base) = @_;
    //     my %ob = ();

    //     $base =~ /^[ACGTacgt]$/ or return ();
    //     %ob = $self->order_base();
    //     return $self->raw_data_for_channel($ob{uc($base)});
    // }
};

Reader.prototype.getTrace = function(base){
    // sub trace {
    //     my ($self, $base) = @_;
    //     my %ob = ();

    //     $base =~ /^[ACGTacgt]$/ or return ();
    //     %ob = $self->order_base();
    //     return $self->analyzed_data_for_channel($ob{uc($base)});
    // }
};

// These are all just simple tag reads.
// Keeping this as a simple map for anyone else's reference.
// Don't worry.  They'll get all nice and camel cased below.
var accessors = {
    'analysis_protocol_settings_name': 'APrN',
    'analysis_protocol_settings_version': 'APrV',
    'analysis_protocol_xml': 'APrX',
    'analysis_protocol_xml_schema_version': 'APXV',
    'analysis_return_code': 'ARTN',
    'average_peak_spacing': 'SPAC',
    'basecaller_apsf': 'ASPF',
    'basecaller_bcp_dll': ['SPAC', 2],
    'basecaller_version': ['SVER', 2],
    'basecalling_analysis_timestamp': 'BCTS',
    'base_locations': ['PLOC', 2],
    'base_locations_edited': 'PLOC',
    'base_spacing': ['SPAC', 3],
    'buffer_tray_temperature': 'BufT',
    'capillary_number': 'LANE',
    'chem': 'phCH',
    'comment': 'CMNT',
    'comment_title': 'CTTL',
    'container_identifier': 'CTID',
    'container_name': 'CTNM',
    'container_owner': 'CTOw',
    'current': ['DATA', 6],
    'data_collection_module_file': 'MODF',
    'data_collection_software_version': 'SVER',
    'data_collection_firmware_version': ['SVER', 3],
    'data_collection_start_date': ['RUND', 3],
    'data_collection_start_time': ['RUNT', 3],
    'data_collection_stop_date': ['RUND', 4],
    'data_collection_stop_time': ['RUNT', 4],
    'detector_heater_temperature': 'DCHT',
    'downsampling_factor': 'DSam',
    'dye_name': 'DyeN',
    'dye_set_name': 'DySN',
    'dye_significance': 'DyeB',
    'dye_type': 'phDY',
    'dye_wavelength': 'DyeW',
    'edited_quality_values': 'PCON',
    'edited_quality_values_ref': 'PCON',
    'edited_sequence': 'PBAS',
    'edited_sequence_length': 'PBAS',
    'electrophoresis_voltage': 'EPVt',
    'gel_type': 'GTyp',
    'gene_mapper_analysis_method': 'ANME',
    'gene_mapper_panel_name': 'PANL',
    'gene_mapper_sample_type': 'STYP',
    'gene_scan_sample_name': 'SpNm',
    'injection_time': 'InSc',
    'injection_voltage': 'InVt',
    'instrument_class': 'HCFG',
    'instrument_family': ['HCFG', 2],
    'instrument_name_and_serial_number': 'MCHN',
    'instrument_param': ['HCFG', 4],
    'is_capillary_machine': 'CpEP',
    'laser_power': 'LsrP',
    'length_to_detector': 'LNTD',
    'mobility_file': ['PDMF', 2],
    'mobility_file_orig': 'PDMF',
    'model_number': 'MODL',
    'noise': 'NOIS',
    'num_capillaries': 'NLNE',
    'num_dyes': 'Dye#',
    'num_scans': 'SCAN',
    'official_instrument_name': ['HCFG', 3],
    'offscale_peaks': 'OffS',
    'offscale_scans': 'OfSc',
    'peak1_location': ['B1Pt', 2],
    'peak1_location_orig': 'B1Pt',
    'peak_area_ratio': 'phAR',
    'pixel_bin_size': 'PXLB',
    'pixels_lane': 'NAVG',
    'plate_type': 'PTYP',
    'plate_size': 'PSZE',
    'polymer_expiration_date': 'SMED',
    'polymer_lot_number': 'SMLt',
    'power': ['DATA', 7],
    'quality_levels': 'phQL',
    'quality_values': ['PCON', 2],
    'quality_values_ref': ['PCON', 2],
    'rescaling': 'Scal',
    'results_group': 'RGNm',
    'results_group_comment': 'RGCm',
    'results_group_owner': 'RGOw',
    'reverse_complement_flag': 'RevC',
    'run_module_name': 'RMdN',
    'run_module_version': 'RMdV',
    'run_module_xml_schema_version': 'RMXV',
    'run_module_xml_string': 'RMdX',
    'run_name': 'RunN',
    'run_protocol_name': 'RPrN',
    'run_protocol_version': 'RPrV',
    'run_start_date': 'RUND',
    'run_start_time': 'RUNT',
    'run_stop_date': ['RUND', 2],
    'run_stop_time': ['RUNT', 2],
    'run_temperature': 'Tmpr',
    'sample_file_format_version': ['SVER', 4],
    'sample_name': 'SMPL',
    'sample_tracking_id': 'LIMS',
    'scanning_rate': 'Rate',
    'scan_color_data_values': 'OvrV',
    'scan_numbers': 'Satd',
    'scan_number_indices': 'OvrI',
    'seqscape_project_name': ['PROJ', 4],
    'seqscape_project_template': 'PRJT',
    'seqscape_specimen_name': 'SPEC',
    'sequence': ['PBAS', 2],
    'sequence_length': ['PBAS', 2],
    'sequencing_analysis_param_filename': ['APFN', 2],
    'signal_level': 'S/N%',
    'size_standard_filename': 'StdF',
    'snp_set_name': 'SnpS',
    'start_collection_event': ['EVNT', 3],
    'start_point': ['ASPt', 2],
    'start_point_orig': 'ASPt',
    'start_run_event': 'EVNT',
    'stop_collection_event': ['EVNT', 4],
    'stop_point': ['AEPt', 2],
    'stop_point_orig': 'AEPt',
    'stop_run_event': ['EVNT', 2],
    'temperature': ['DATA', 8],
    'trim_probability_threshold': ['phTR', 2],
    'trim_region': 'phTR',
    'voltage': ['DATA', 5],
    'user': 'User',
    'well_id': 'TUBE'
};

Object.keys(accessors).map(function(accessor){
    var r = /[-_]([a-z])/g;
    var name = accessor.replace(regexp, function(match, c){
        return c.toUpperCase();
    });
    name = method.charAt(0).toUpperCase() + method.substring(1);

    var args = accessors[accessor];
    if(!Array.isArray(args)){
        args = [args];
    }

    Reader.prototype['get' + name] = function(){
        return this.getData.apply(this, args);
    };

});