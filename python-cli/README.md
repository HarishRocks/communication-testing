# Device Provision Tool

## Python CLI

### Setup

- Python v3
- Run `pip install -r requirements.txt`

### Usage

```
> python cli.py -h

usage: cli.py [-h] {gen-key1,gen-key2,add-header,sign-header,decode-header} ...

positional arguments:
  {gen-key,add-header,sign-header,decode-header}
                        sub-command help
    gen-key             Generate the first key pairs
    add-header          Add headers to the binary file
    sign-header         Sign the binary file
    decode-header       Decodes headers of the binary file

optional arguments:
  -h, --help            show this help message and exit
```

### Step by Step Guide

### Generate private and public key pairs

#### Generate private and public key pairs

We will be using `gen-key` for creating the two key pairs.
These commands will create public and private key files with `.h` extension.

- Running `python cli.py gen-key --index=1` will generate the first private and public key.
- Running `python cli.py gen-key --index=2` will generate the second private and public key.

**NOTE:** If you run the `gen-key` command again, the private
and public key files will be replaced.

You can change the filepath of the public and private key via the optional arguments.

```
> python cli.py gen-key -h

usage: index.py gen-key [-h] [--private-key PRIVATE_KEY] [--public-key PUBLIC_KEY] [--index INDEX]

optional arguments:
  -h, --help            show this help message and exit
  --private-key PRIVATE_KEY
                        Path to the save the private key file. Defaults to `private_key`
  --public-key PUBLIC_KEY
                        Path to the save the public key file. Defaults to `public_key`
  --index INDEX         Index of the key pairs. Defaults to `1`
```

#### Adding headers and first signature

Now we have the 2 key pairs for the signature.

In this step we will add the headers and the 1st signature to the binary file.

We need the following files before doing this.

- `BlinkLed.bin` - The bin file that is to be signed.
- `BlinkLed-version.txt` - This file will have parameters for the headers.
- `private_key1.h` - The private key used for signature.

  Example:

  ```
  firmware version=011:055:064:505
  hardware version=001:005:004:005
  magic number=45227A01
  ```

  **NOTE:**: Note that the magic number is in hex

Running `python cli.py add-header` will generate a new bin file (`BlinkLed_Header.bin`)
by adding headers and the first signature to the existing binary file.

You can change the filepath of the input/output binary file, the version file and
the private key file via the optional arguments.

```
> python cli.py add-header -h

usage: cli.py add-header [-h] [--private-key PRIVATE_KEY] [--input INPUT] [--output OUTPUT]
                         [--version VERSION]

optional arguments:
  -h, --help            show this help message and exit
  --private-key PRIVATE_KEY
                        Path to the private key file. Defaults to `private_key1.h`
  --input INPUT         Path to the input bin file. Defaults to `BlinkLed.bin`
  --output OUTPUT       Path to the output bin file. Defaults to `BlinkLed_Header.bin`
  --version VERSION     Path to the version file. Defaults to `BlinkLed-version.txt`
```

#### Adding second signature

Now we have a binary file with the header and first signature.

In this step we will add 2nd signature to the binary file.

We need the following files before doing this.

- `BlinkLed_Header.bin` - The bin file with the header and 1st signature that is to be signed.
- `private_key2.h` - The private key used for signature.

Running `python cli.py sign-header` will generate a new bin file (`app_dfu_package.bin`)
by adding the second signature to the existing binary file.

You can change the filepath of the input/output binary file and the private key
file via the optional arguments.

```
> python cli.py sign-header -h

usage: cli.py sign-header [-h] [--private-key PRIVATE_KEY] [--input INPUT] [--output OUTPUT]

optional arguments:
  -h, --help            show this help message and exit
  --private-key PRIVATE_KEY
                        Path to the private key file. Defaults to `private_key2.h`
  --input INPUT         Path to the input bin file. Defaults to `BlinkLed_Header.bin`
  --output OUTPUT       Path to the output bin file. Defaults to `app_dfu_package.bin`
```

#### Decoding headers

If you have the binary file with added header with 1 signature or with 2 signatures,
you can use this command to check the header data.

We need the following files before doing this.

- `app_dfu_package.bin` - The bin file with the header and 1 or 2 signature that is to be decoded.

Running `python cli.py decode-header` will print the header data on the console.

You can change the filepath of the input binary file via the optional arguments.

```
> python cli.py decode-header -h

usage: cli.py decode-header [-h] [--input INPUT]

optional arguments:
  -h, --help     show this help message and exit
  --input INPUT  Path to the input bin file. Defaults to `app_dfu_package.bin`
```
